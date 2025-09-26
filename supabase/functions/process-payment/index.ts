import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { action, planId, amount, currency = 'INR' } = await req.json();
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: 'Payment configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (action === 'create_order') {
      // Create Razorpay order
      const orderData = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt: `order_${Date.now()}_${user.id}`,
        notes: {
          user_id: user.id,
          plan_id: planId
        }
      };

      const authHeader = 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
      
      const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const order = await razorpayResponse.json();

      if (!razorpayResponse.ok) {
        console.error('Razorpay error:', order);
        return new Response(
          JSON.stringify({ error: 'Failed to create payment order' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Save payment record
      const { error: dbError } = await supabaseClient
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          subscription_id: planId,
          amount,
          currency,
          transaction_id: order.id,
          status: 'pending'
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      return new Response(
        JSON.stringify({ 
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          key: razorpayKeyId
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (action === 'verify_payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
      
      // Verify signature
      const encoder = new TextEncoder();
      const data = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`);
      const keyData = encoder.encode(razorpayKeySecret);
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
      const generated_signature = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (generated_signature !== razorpay_signature) {
        return new Response(
          JSON.stringify({ error: 'Invalid payment signature' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Update payment status
      const { error: updateError } = await supabaseClient
        .from('payment_transactions')
        .update({ 
          status: 'completed',
          transaction_id: razorpay_payment_id 
        })
        .eq('transaction_id', razorpay_order_id);

      if (updateError) {
        console.error('Payment update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update payment status' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Update user subscription or role
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({ user_role: planId === 'premium' ? 'premium' : 'deluxe' })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Payment verified successfully' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in process-payment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});