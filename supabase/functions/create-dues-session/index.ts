import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    var body = await req.json();
    var { organization_id, member_id, tier_id, amount, member_name, member_email } = body;

    if (!organization_id || !member_id || !amount || !member_email) {
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    var supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get org to confirm Stripe Connect is active
    var { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, stripe_account_id, stripe_connect_status')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      return new Response(JSON.stringify({ error: 'Organization not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (org.stripe_connect_status !== 'active' || !org.stripe_account_id) {
      return new Response(JSON.stringify({ error: 'This organization has not connected Stripe.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    var stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    var amountCents = Math.round(parseFloat(amount) * 100);

    var session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: member_email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Membership Dues — ' + org.name,
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: 'dues',
          organization_id: organization_id,
          member_id: member_id,
          tier_id: tier_id || '',
          amount: String(amount),
          member_name: member_name || '',
          member_email: member_email,
        },
        success_url: 'https://syndicade.org/dues-success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://syndicade.org/dues-cancelled',
      },
      {
        stripeAccount: org.stripe_account_id,
      }
    );

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('create-dues-session error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});