import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============================================================
    // START: SECURITY BLOCK
    // ============================================================
    // 1. Get the secret token you created from the environment variables.
    const functionSecret = Deno.env.get('NOTIFICATION_FUNCTION_SECRET');
    if (!functionSecret) {
      console.error('NOTIFICATION_FUNCTION_SECRET is not set.');
      return new Response(JSON.stringify({ error: 'Internal server configuration error.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Get the Authorization header from the incoming request.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Forbidden: Missing or invalid authorization header.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Extract and compare the token.
    const clientToken = authHeader.substring(7); // Remove "Bearer " prefix
    if (clientToken !== functionSecret) {
      return new Response(JSON.stringify({ error: 'Forbidden: Invalid token.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // ============================================================
    // END: SECURITY BLOCK - Request is now authenticated
    // ============================================================

    // Create Supabase client (using service role is now safe because we've authenticated the request)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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

    // Get user profile and preferences (this part of your logic is fine)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('User not found:', profileError);
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Store notification in database
    const { error: notificationError } = await supabaseClient
      .from('email_notifications') // Corrected table name from your previous code
      .insert({
        user_id: userId,
        type,
        title,
        content,
        metadata,
        status: 'sent'
      });

    if (notificationError) {
      console.error('Failed to store notification:', notificationError);
      return new Response(JSON.stringify({ error: 'Failed to store notification' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Notification stored for user ${userId}: ${title}`);

    return new Response(JSON.stringify({ success: true, message: 'Notification processed successfully' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Error in send-notification function:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
