import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'resend';

// --- Helper Functions ---

/**
 * Generates the human-readable text for a single notification.
 */
function getNotificationText(notification: any): string {
  const actorName = notification.actor?.full_name || 'Someone';
  const spaceName = notification.space?.name || 'your space';

  switch (notification.type) {
    case 'system_update':
      // [!code ++]
      // We now pull details from the joined announcement
      const title = notification.announcement?.title || 'System Update';
      const body = notification.announcement?.body || 'Check out the latest features.';
      // Return HTML to be rendered in the list item
      return `<strong style="display: block; font-size: 17px; color: #111;">${title}</strong>${body}`;
    case 'new_public_post_by_followed_user':
      return `${actorName} (who you follow) created a new post.`;
    case 'new_public_space_by_followed_user':
      return `${actorName} (who you follow) created a new space.`;
    case 'connection_accepted':
      return `${actorName} accepted your connection request.`;
    case 'job_application_update':
      return `Your application for a job has been updated.`;
    case 'new_reply_to_your_message':
      return `${actorName} replied to your message.`;
    case 'new_direct_message':
      return `${actorName} sent you a new direct message.`;
    case 'space_join_request':
      return `${actorName} requested to join ${spaceName}.`;
    default:
      return 'You have a new notification.';
  }
}

/**
 * Generates the final HTML for the weekly digest email.
 */
function generateDigestEmail(userName: string, notifications: any[]): string {
  const notificationCount = notifications.length;
  const greeting = userName ? `Hi ${userName}` : 'Hi there';

  const notificationListHtml = notifications
    .map(
      (n) => `
    <li style="margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid #eee; font-size: 16px; color: #333; line-height: 1.5;">
      ${getNotificationText(n)}
    </li>
  `
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #111;">${greeting},</h2>
      <p style="font-size: 16px; color: #555;">
        Here's your weekly summary. You have ${notificationCount} new update${
    notificationCount > 1 ? 's' : ''
  }:
      </p>
      <ul style="list-style-type: none; padding-left: 0; margin-top: 25px;">
        ${notificationListHtml}
      </ul>
      <p style="margin-top: 30px; text-align: center;">
        <a 
          href="https://aim-med-nexus.lovable.app/#/notifications" 
          style="background-color: #0a0a0a; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;"
        >
          View All Notifications
        </a>
      </p>
      <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
        To change your email settings, visit your account preferences on our website.
      </p>
    </div>
  `;
}

// --- MAIN FUNCTION HANDLER ---

Deno.serve(async (req) => {
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  // 2. Check Cron Secret for security
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Forbidden: Invalid secret' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 3. Initialize Admin Clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // 4. Get all users who have email_enabled = true
    const { data: eligibleUsers, error: eligibleUsersError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        user:auth.users!id ( email ),
        preferences:notification_preferences!user_id ( email_enabled )
      `)
      .eq('preferences.email_enabled', true);

    if (eligibleUsersError) throw eligibleUsersError;

    if (!eligibleUsers || eligibleUsers.length === 0) {
      return new Response(JSON.stringify({ message: 'No users eligible for email.' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. Calculate date for "past week"
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    // 6. Loop over each eligible user
    for (const user of eligibleUsers) {
      // @ts-ignore
      const userId = user.id;
      // @ts-ignore
      const userName = user.full_name;
      // @ts-ignore
      const userEmail = user.user?.email;

      if (!userEmail) {
        console.warn(`User ${userId} has email_enabled but no email found. Skipping.`);
        failCount++;
        continue;
      }

      // 7. Get their unread notifications from the past week
      const { data: notifications, error: notifError } = await supabaseAdmin
        .from('notifications')
        .select(
          `
          id,
          type,
          created_at,
          actor:profiles!actor_id (
            full_name
          ),
          space:spaces (
            name
          ),
          announcement:announcements (
            title,
            body
          )
        `
        )
        .eq('user_id', userId)
        .eq('is_read', false) // <-- Only get unread notifications
        .gte('created_at', oneWeekAgo.toISOString())
        .lt('created_at', now.toISOString()) 
        .order('created_at', { ascending: false });

      if (notifError) {
        console.error(`Error fetching notifications for ${userId}:`, notifError);
        failCount++;
        continue;
      }

      if (!notifications || notifications.length === 0) {
        skippedCount++;
        continue;
      }

      // 8. Format and Send the Email
      try {
        const emailHtml = generateDigestEmail(userName, notifications);
        const subject = `Your Weekly Digest: ${notifications.length} New Update${notifications.length > 1 ? 's' : ''}`;
        
        await resend.emails.send({
          // Remember to use your new verified domain here
          from: 'Your App Name <notifications@aimmednexus.in>', 
          to: userEmail,
          subject: subject,
          html: emailHtml,
        });
        
        console.log(`Successfully sent digest to ${userEmail}`);
        successCount++;
        
      } catch (emailError) {
        console.error(`Failed to send email to ${userEmail}:`, emailError);
        failCount++;
      }
    } // End user loop

    // 9. Return a final status
    const summary = {
      message: 'Weekly digest job completed.',
      sent: successCount,
      failed: failCount,
      skipped_no_notifs: skippedCount,
    };
    
    return new Response(JSON.stringify(summary), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in main function handler:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
