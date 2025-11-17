import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend';

// Helper: Generates the HTML for a single notification
function getNotificationEmail(
  userName: string,
  notification: any // Using 'any' as it's the full type from get_my_notifications RPC
): { subject: string; html: string } {
  const actorName = notification.actor?.full_name || 'Someone';
  const spaceName = notification.space?.name || 'a space';
  let subject = 'You have a new notification on AIMedNet';
  let description = 'You have a new update on AIMedNet.';
  let link = 'https://aimmednexus.in/notifications'; // Default link

  // This logic is now a complete copy of your getNotificationDetails function
  switch (notification.type) {
    // --- System ---
    case 'system_update':
      subject = notification.announcement?.title || 'System Update';
      description = notification.announcement?.body || 'Check out the latest features and announcements.';
      link = 'https://aimmednexus.in/notifications'; // System updates don't have a deep link
      break;

    // --- Social ---
    case 'new_connection_request':
      subject = 'You have a new connection request';
      description = `${actorName} wants to connect with you.`;
      link = `https://aimmednexus.in/profile/${notification.actor_id}`;
      break;
    case 'connection_accepted':
      subject = 'Your connection request was accepted';
      description = `${actorName} accepted your connection request.`;
      link = `https://aimmednexus.in/profile/${notification.actor_id}`;
      break;
    case 'new_direct_message':
      subject = `New message from ${actorName}`;
      description = `${actorName} sent you a new direct message.`;
      link = 'https://aimmednexus.in/inbox';
      break;

    // --- Community / Forums (Added) ---
    case 'new_public_post_by_followed_user':
      subject = `New post from ${actorName}`;
      description = `${actorName} (who you follow) posted: "${notification.thread?.title || 'a new post'}".`;
      link = `https://aimmednexus.in/community/thread/${notification.entity_id}`;
      break;
    case 'new_public_space_by_followed_user':
      subject = `New space from ${actorName}`;
      description = `${actorName} (who you follow) created a new space: "${notification.space?.name || '...'}".`;
      link = `https://aimmednexus.in/community/space/${notification.entity_id}`;
      break;
    case 'new_reply_to_your_message':
      subject = `New reply from ${actorName}`;
      description = `${actorName} replied to your message in "${notification.thread?.title || 'a post'}".`;
      link = `https://aimmednexus.in/community/thread/${notification.entity_id}`;
      break;
    case 'new_thread':
      subject = `New post in ${spaceName}`;
      description = `${actorName} posted "${notification.thread?.title || 'a new post'}" in ${spaceName}.`;
      link = `https://aimmednexus.in/community/thread/${notification.entity_id}`;
      break;
    case 'new_space':
      subject = `You've been added to ${spaceName}`;
      description = `Your request to join ${spaceName} was approved.`;
      link = `https://aimmednexus.in/community/space/${notification.entity_id}`;
      break;

    // --- Jobs & Opportunities (Manager/Applicant) ---
    case 'job_application_update':
      subject = 'An update on your job application';
      description = `Your application for "${notification.job_application?.job_title || 'a job'}" was updated to: ${notification.job_application?.status || '...'}.`;
      link = 'https://aimmednexus.in/industryhub/my-applications';
      break;
    case 'new_job_posting': // --- ADDED ---
      subject = `New Job Posting: ${notification.job?.title || '...'}`;
      description = `${actorName} posted a new job: "${notification.job?.title || '...'}".`;
      link = `https://aimmednexus.in/jobs/details/${notification.entity_id}`;
      break;
    case 'new_collaboration_posting': // --- ADDED ---
      subject = `New Collaboration: ${notification.collaboration?.title || '...'}`;
      description = `${actorName} posted a new collaboration: "${notification.collaboration?.title || '...'}".`;
      link = `https://aimmednexus.in/collabs/details/${notification.entity_id}`;
      break;
    case 'new_job_applicant':
      subject = 'You have a new job applicant';
      description = `${actorName} applied for your job: "${notification.job_application?.job_title || '...'}".`;
      link = `https://aimmednexus.in/industryhub/dashboard/${notification.job_application?.company_id}?tab=applicants`;
      break;
    case 'new_collaboration_applicant': // --- ADDED ---
      subject = 'You have a new collaboration applicant';
      description = `${actorName} applied for your collaboration: "${notification.collaboration_application?.collaboration_title || '...'}".`;
      link = `https://aimmednexus.in/industryhub/dashboard/${notification.collaboration_application?.company_id}?tab=applicants`;
      break;

    // --- Fallback ---
    default:
      subject = 'You have a new notification';
      description = 'You have a new update on AIMedNet.';
      link = 'https://aimmednexus.in/notifications';
      break;
  }

  const greeting = userName ? `Hi ${userName}` : 'Hi there';

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #111; font-size: 24px;">${greeting},</h2>
      <p style="font-size: 16px; color: #555;">
        You have a new notification on AIMedNet:
      </p>
      <div style="margin-top: 25px; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #eee;">
        <p style="font-size: 17px; color: #333; line-height: 1.5; margin: 0;">
          ${description}
        </p>
      </div>
      <p style="margin-top: 30px; text-align: center;">
        <a 
          href="${link}" 
          style="background-color: #0a0a0a; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;"
        >
          View Notification
        </a>
      </p>
      <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
        To change your email settings, visit your account preferences on AIMedNet.
      </p>
    </div>
  `;

  return { subject, html };
}

// --- MAIN FUNCTION HANDLER ---

Deno.serve(async (req) => {
  const payload = await req.json();
  const notification = payload.record;

  try {
    // 1. Initialize Admin Clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // 2. Get the user's profile & notification preferences
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', notification.user_id)
      .single();

    if (profileError) throw new Error(`User profile not found: ${profileError.message}`);
    if (!profile || !profile.email) throw new Error('User has no profile or email.');

    // 3. Get the user's notification preferences
    const { data: preferences, error: prefsError } = await supabaseAdmin
      .from('notification_preferences')
      .select('email_enabled, direct_messages, connection_requests, job_alerts, forum_updates, follows_activity')
      .eq('user_id', notification.user_id)
      .maybeSingle(); // Use maybeSingle() in case no row exists

    if (prefsError) {
      console.warn(`Could not find preferences for user ${notification.user_id}. Using defaults. Error: ${prefsError.message}`);
    }

    // 3. Check if this *type* of email is enabled
    const prefs = (user.prefs && user.prefs.length > 0) ? user.prefs[0] : { email_enabled: true }; 
    if (!prefs.email_enabled) {
      return new Response(JSON.stringify({ message: 'User has all emails disabled.' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- ADDED: Comprehensive Preference Checks ---
    let canSend = false;
    switch (notification.type) {
      case 'new_direct_message':
        canSend = prefs.direct_messages ?? true;
        break;
      case 'new_connection_request':
      case 'connection_accepted':
        canSend = prefs.connection_requests ?? true;
        break;
      case 'job_application_update':
      case 'new_job_applicant':
      case 'new_collaboration_applicant':
      case 'new_job_posting':
      case 'new_collaboration_posting':
        canSend = prefs.job_alerts ?? true;
        break;
      case 'new_reply_to_your_message':
      case 'new_thread':
      case 'new_space':
        canSend = prefs.forum_updates ?? true;
        break;
      case 'new_public_post_by_followed_user':
      case 'new_public_space_by_followed_user':
        canSend = prefs.follows_activity ?? true;
        break;
      case 'system_update':
        canSend = true; // System updates always send (unless email_enabled is false)
        break;
      default:
        canSend = true; // Default to sending if not specified
    }
    // --- END: Added Checks ---

    if (!canSend) {
      return new Response(JSON.stringify({ message: 'User has this type of email disabled.' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // 4. Get the *full* notification data (with all joins)
    const { data: fullNotification, error: rpcError } = await supabaseAdmin
      .rpc('get_my_notifications') // This RPC already has all the joins
      .eq('id', notification.id) // Filter it to just this one
      .single();
      
    if (rpcError) throw new Error(`Could not fetch full notification: ${rpcError.message}`);
    if (!fullNotification) throw new Error('Full notification not found.');

    // 5. Generate and Send Email
    const { subject, html } = getNotificationEmail(user.full_name, fullNotification);

    await resend.emails.send({
      from: 'AIMedNet <notifications@aimmednexus.in>',
      to: user.email,
      subject: subject,
      html: html,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-instant-notification:', error.message);
    // Return 200 so the trigger doesn't retry
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
