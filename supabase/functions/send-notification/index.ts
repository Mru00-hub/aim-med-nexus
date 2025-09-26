import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role for admin operations
    );

    const { userId, type, title, content, metadata = {} } = await req.json();

    if (!userId || !type || !title || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user profile and preferences
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('User not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check notification preferences
    const { data: preferences } = await supabaseClient
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Store notification in database
    const { error: notificationError } = await supabaseClient
      .from('email_notifications')
      .insert({
        user_id: userId,
        type,
        title,
        content,
        metadata,
        status: 'pending'
      });

    if (notificationError) {
      console.error('Failed to store notification:', notificationError);
    }

    // Send email if user has email notifications enabled
    if (preferences?.email_enabled !== false) {
      try {
        const emailResponse = await resend.emails.send({
          from: "AIMedNet <notifications@aimednet.com>",
          to: [profile.email],
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">AIMedNet</h1>
                <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Healthcare Professional Network</p>
              </div>
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">${title}</h2>
                <div style="color: #666; line-height: 1.6; margin: 20px 0;">
                  ${content}
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    This email was sent to ${profile.email}. To update your notification preferences, 
                    <a href="${Deno.env.get('SUPABASE_URL')}/notifications" style="color: #667eea;">click here</a>.
                  </p>
                </div>
              </div>
            </div>
          `,
        });

        console.log("Email sent successfully:", emailResponse);

        // Update notification status
        if (!notificationError) {
          await supabaseClient
            .from('email_notifications')
            .update({ status: 'sent' })
            .eq('user_id', userId)
            .eq('type', type)
            .eq('title', title);
        }

      } catch (emailError) {
        console.error("Error sending email:", emailError);
        
        // Update notification status to failed
        if (!notificationError) {
          await supabaseClient
            .from('email_notifications')
            .update({ status: 'failed' })
            .eq('user_id', userId)
            .eq('type', type)
            .eq('title', title);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification processed successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});