// supabase/functions/update-post/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { postId, content } = await req.json()
    if (!postId || !content) throw new Error('Missing required fields')
    
    // RLS policy will automatically check if the auth.uid() matches the post's user_id.
    const { data, error } = await supabase
      .from('forum_posts')
      .update({ content })
      .eq('id', postId)
      .select()
      .single()
    
    if (error) throw error
    if (!data) throw new Error('Post not found or permission denied.')

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
