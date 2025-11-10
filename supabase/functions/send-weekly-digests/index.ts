import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend';

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
          href="https://aim-med-nexus.in/notifications" 
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
  const authHeader = req.headers.get('X-Cron-Secret');
  const cronSecret = Deno.env.get('CRON_SECRET');
  console.log('--- DEBUGGING SECRET CHECK ---');
  console.log('Received authHeader:', authHeader);
  console.log('Expected cronSecret:', cronSecret ? `"${cronSecret}"` : '(CRON_SECRET is NOT SET or DEPLOYED!)');
  if (!cronSecret || authHeader !== cronSecret) {
    console.warn('Forbidden: Invalid or missing cron secret.');
    return new Response(JSON.stringify({ error: 'Forbidden: Invalid secret' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log('Function invoked with valid secret. Starting digest job...');

  try {
    // 3. Initialize Admin Clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const MY_TEST_USER_ID = '39b25a48-7c7e-44b4-bc2d-2e07cf68c2ed';

    // 4. Get all users who have email_enabled = true
    const { data: eligibleUserIds, error: eligibleIdsError } = await supabaseAdmin
      .from('notification_preferences')
      .select('user_id')
      .eq('email_enabled', true)
      .eq('user_id', MY_TEST_USER_ID);

    if (eligibleIdsError) throw eligibleIdsError;

    if (!eligibleUserIds || eligibleUserIds.length === 0) {
      console.log('No users are eligible for email. Job complete.');
      return new Response(JSON.stringify({ message: 'No users eligible for email.' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert the array of objects (e.g., [{user_id: '...'}]) into a simple array of strings
    const userIds = eligibleUserIds.map((item) => item.user_id);

    // 4. (NEW STEP 2) Get the profiles for those eligible user IDs
    const { data: eligibleUsers, error: eligibleUsersError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        email
      `)
      .in('id', userIds); // Use .in() to get all users in the list

    if (eligibleUsersError) throw eligibleUsersError;

    // [!code ++]
    console.log(`Query for eligible users complete. Found: ${eligibleUsers?.length || 0}`);

    if (!eligibleUsers || eligibleUsers.length === 0) {
      // This case should be rare if data is in sync, but it's good to keep
      console.log('Found eligible IDs but no matching profiles. Job complete.');
      return new Response(JSON.stringify({ message: 'No matching profiles found for eligible IDs.' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. Calculate date for "past week"
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    console.log(`Starting to loop through ${eligibleUsers.length} users...`);

    // 6. Loop over each eligible user
    for (const user of eligibleUsers) {
      // @ts-ignore
      const userId = user.id;
      // @ts-ignore
      const userName = user.full_name;
      // @ts-ignore
      const userEmail = user.email;

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
          entity_id,       
          announcement_id, 
          actor:profiles!actor_id (
            full_name
          )
        `
        )
        .eq('user_id', userId)
        .eq('is_read', false)
        .gte('created_at', oneWeekAgo.toISOString())
        .lt('created_at', now.toISOString())
        .order('created_at', { ascending: false });

      if (notifError) {
        console.error(`Error fetching notifications for ${userId}:`, notifError);
        failCount++;
        continue;
      }

      console.log(`Checked user ${userId} (${userEmail}). Found ${notifications?.length || 0} new notifications.`);

      if (!notifications || notifications.length === 0) {
        skippedCount++;
        continue;
      }

      const spaceIds = notifications
        .filter(n => (n.type === 'new_public_space_by_followed_user' || n.type === 'space_join_request') && n.entity_id)
        .map(n => n.entity_id);
        
      const announcementIds = notifications
        .filter(n => n.type === 'system_update' && n.announcement_id)
        .map(n => n.announcement_id);

      // Fetch the related data in parallel
      const [
        { data: spacesData },
        { data: announcementsData }
      ] = await Promise.all([
        // Query 1: Get all spaces we need
        supabaseAdmin.from('spaces').select('id, name').in('id', spaceIds),
        
        // Query 2: Get all announcements we need
        supabaseAdmin.from('announcements').select('id, title, body').in('id', announcementIds)
      ]);

      // Create quick lookup maps for the data
      const spaceMap = new Map(spacesData?.map(s => [s.id, s]));
      const announcementMap = new Map(announcementsData?.map(a => [a.id, a]));

      // "Hydrate" the original notifications array
      const hydratedNotifications = notifications.map(n => {
        let space = null;
        let announcement = null;

        // If it's a space notification, find its data in the spaceMap
        if ((n.type === 'new_public_space_by_followed_user' || n.type === 'space_join_request') && n.entity_id) {
          space = spaceMap.get(n.entity_id);
        }
        
        // If it's a system update, find its data in the announcementMap
        if (n.type === 'system_update' && n.announcement_id) {
          announcement = announcementMap.get(n.announcement_id);
        }

        // Return the original notification + the new data
        return {
          ...n,
          space,
          announcement
        };
      });

      // 8. Format and Send the Email
      try {
        const emailHtml = generateDigestEmail(userName, hydratedNotifications);
        const subject = `Your Weekly Digest: ${hydratedNotifications.length} New Update${hydratedNotifications.length > 1 ? 's' : ''}`;
        console.log(`Attempting to send email to ${userEmail}...`);
        
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

    console.log('Job finished. Returning summary:', JSON.stringify(summary));
    
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
