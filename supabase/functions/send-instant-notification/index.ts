import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend';

// --- CONFIG ---
const BATCH_SIZE = 10;        // Process 10 emails per execution
const SLEEP_MS = 1000;        // Wait 1 second between emails to respect rate limits

// --- HELPER: Sleep function ---
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- HELPER: Generate Email Content ---
function getNotificationEmail(payload: any) {
  // Extract data from the JSONB payload stored in the queue
  const notification = payload.record;
  const actorName = payload.actor?.full_name || 'Someone';
  const spaceName = payload.space?.name || 'a space';
  
  // Default values
  let subject = 'You have a new notification on AIMedNet';
  let description = 'You have a new update on AIMedNet.';
  let link = 'https://aimmednexus.in/notifications';

  // Logic to determine Subject, Description, and Link based on Type
  switch (notification.type) {
    // --- System (Handled by broadcast usually, but kept for fallback) ---
    case 'system_update':
      subject = payload.announcement?.title || 'System Update';
      description = payload.announcement?.body || 'Check out the latest features.';
      link = 'https://aimmednexus.in/notifications';
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

    // --- Community / Forums ---
    case 'new_public_post_by_followed_user':
      subject = `New post from ${actorName}`;
      description = `${actorName} (who you follow) posted: "${payload.thread?.title || 'a new post'}".`;
      link = `https://aimmednexus.in/community/thread/${notification.entity_id}`;
      break;
    case 'new_public_space_by_followed_user':
      subject = `New space from ${actorName}`;
      description = `${actorName} (who you follow) created a new space: "${payload.space?.name || '...'}".`;
      link = `https://aimmednexus.in/community/space/${notification.entity_id}`;
      break;
      
    // 1. General Thread Activity (Top-level comment on your post)
    case 'new_reply':
      // Subject: Focuses on the Topic
      subject = `New comment on: "${payload.thread?.title || 'your post'}"`;
      // Body: "User X commented on your post"
      description = `${actorName} commented on your post in "${payload.space?.name || 'the community'}".`;
      link = `https://aimmednexus.in/community/thread/${notification.entity_id}`;
      break;

    // 2. Specific Conversation (Direct reply to your comment)
    case 'new_reply_to_your_message':
      // Subject: Focuses on the Person
      subject = `${actorName} replied to you`;
      // Body: "User X replied to your comment in Thread Y"
      description = `${actorName} replied to your comment in "${payload.thread?.title || 'a discussion'}".`;
      link = `https://aimmednexus.in/community/thread/${notification.entity_id}`;
      break;

    case 'new_thread':
      subject = `New post in ${spaceName}`;
      description = `${actorName} posted "${payload.thread?.title || 'a new post'}" in ${spaceName}.`;
      link = `https://aimmednexus.in/community/thread/${notification.entity_id}`;
      break;
    case 'new_space':
      subject = `You've been added to ${spaceName}`;
      description = `Your request to join ${spaceName} was approved.`;
      link = `https://aimmednexus.in/community/space/${notification.entity_id}`;
      break;
    case 'space_join_request':
      subject = 'New Request to Join Space';
      description = `${actorName} has requested to join the space "${payload.space?.name || '...'}".`;
      // Adjust link to where admins manage requests
      link = `https://aimmednexus.in/community/space/${notification.entity_id}`; 
      break;

    // --- Jobs & Opportunities ---
    case 'job_application_update':
      subject = 'An update on your job application';
      description = `Your application for "${payload.job_application?.job_title || 'a job'}" was updated to: ${payload.job_application?.status || '...'}.`;
      link = 'https://aimmednexus.in/industryhub/my-applications';
      break;
    case 'new_job_posting':
      subject = `New Job Posting: ${payload.job?.title || '...'}`;
      description = `${actorName} posted a new job: "${payload.job?.title || '...'}".`;
      link = `https://aimmednexus.in/jobs/details/${notification.entity_id}`;
      break;
    case 'new_collaboration_posting':
      subject = `New Collaboration: ${payload.collaboration?.title || '...'}`;
      description = `${actorName} posted a new collaboration: "${payload.collaboration?.title || '...'}".`;
      link = `https://aimmednexus.in/collabs/details/${notification.entity_id}`;
      break;
    case 'new_job_applicant':
      subject = 'You have a new job applicant';
      description = `${actorName} applied for your job: "${payload.job_application?.job_title || '...'}".`;
      link = `https://aimmednexus.in/industryhub/dashboard/${payload.job_application?.company_id}?tab=applicants`;
      break;
    case 'new_collaboration_applicant':
      subject = 'You have a new collaboration applicant';
      description = `${actorName} applied for your collaboration: "${payload.collaboration_application?.collaboration_title || '...'}".`;
      link = `https://aimmednexus.in/industryhub/dashboard/${payload.collaboration_application?.company_id}?tab=applicants`;
      break;
    case 'new_company':
      const companyName = payload.company?.name || 'a new company';
      subject = `New Company on Industry Hub: ${companyName}`;
      description = `${actorName} created a new company page: "${companyName}". Check it out!`;
      // Assuming your route is /industryhub/company/:id
      link = `https://aimmednexus.in/industryhub/company/${notification.entity_id}`;
      break;
    case 'new_follower':
      subject = `${actorName} started following you`;
      description = `${actorName} is now following you. View their profile to connect.`;
      link = `https://aimmednexus.in/profile/${notification.actor_id}`;
      break;
    case 'new_reaction':
      // Note: entity_id is thread_id based on our SQL fix
      subject = `${actorName} reacted to your post`;
      description = `${actorName} reacted to a message you posted in "${payload.thread?.title || 'a conversation'}".`;
      link = `https://aimmednexus.in/community/thread/${notification.entity_id}`;
      break;

    // --- Fallback ---
    default:
      // Keep defaults set above
      break;
  }

  // Personalize Greeting
  // Note: Usually we send the user's name in the trigger payload or fetch it. 
  // If it's not in the payload, we default to 'Hi there'.
  const greeting = payload.user_name ? `Hi ${payload.user_name}` : 'Hi there';

  // HTML Template
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

// --- MAIN WORKER ---
Deno.serve(async (req) => {
  try {
    // 1. Initialize Clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // 2. Fetch Pending Items from Queue
    const { data: queueItems, error: fetchError } = await supabaseAdmin
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) throw fetchError;
    
    // If queue is empty, return early
    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ message: 'Queue empty' }), { 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing batch of ${queueItems.length} emails...`);

    // 3. Loop through items and send one by one
    for (const item of queueItems) {
      try {
        const payload = item.payload; // The JSONB object from your Trigger
        const userEmail = item.user_email;

        // Generate Email Content
        const { subject, html } = getNotificationEmail(payload); 

        // Send via Resend
        const { data, error: resendError } = await resend.emails.send({
          from: 'AIMedNet <notifications@aimmednexus.in>',
          to: userEmail,
          subject: subject,
          html: html,
        });

        if (resendError) {
          console.error(`Resend Failed (ID: ${item.id}):`, resendError);
          // Mark as failed in DB
          await supabaseAdmin
            .from('email_queue')
            .update({ status: 'failed' })
            .eq('id', item.id);
        } else {
          // Mark as Sent in DB
          await supabaseAdmin
            .from('email_queue')
            .update({ status: 'sent' })
            .eq('id', item.id);
          
          // Optional: Delete the row to keep table small (Uncomment if preferred)
          // await supabaseAdmin.from('email_queue').delete().eq('id', item.id); 
        }

        // 4. CRITICAL: Rate Limiting Sleep
        // Waits 1 second before processing the next item in the loop
        await sleep(SLEEP_MS);

      } catch (innerError) {
        console.error(`Processing Internal Error (ID: ${item.id}):`, innerError);
        // Mark as failed_internal so we don't retry infinitely
        await supabaseAdmin
          .from('email_queue')
          .update({ status: 'failed_internal' })
          .eq('id', item.id);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: queueItems.length }), { 
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
