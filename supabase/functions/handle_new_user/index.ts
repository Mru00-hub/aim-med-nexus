// Path: supabase/functions/handle-new-user/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

console.log('Edge Function "handle-new-user" is up and running!');

serve(async (req) => {
  try {
    // Create an admin Supabase client to perform privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the new user object from the webhook payload
    const { record: newUser } = await req.json();

    // --- This section replaces your 'handle_new_user' SQL logic ---
    // Example: Insert a new row into a public 'profiles' table
    const { error } = await supabaseAdmin.from('profiles').insert({
      id: newUser.id,
      email: newUser.email,
      // Add other default columns for your profiles table here
    });

    if (error) {
      console.error('Error within Edge Function:', error.message);
      throw error;
    }
    // --- End of replacement logic ---

    return new Response(JSON.stringify({ message: "Successfully handled new user" }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
