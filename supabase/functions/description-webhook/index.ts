import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Get customerId from URL params
  const url = new URL(req.url);
  const customerId = url.searchParams.get('customerId');

  try {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    // Get the API response from the request body
    const body = await req.json().catch(error => {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request body');
    });

    console.log('Received webhook data:', JSON.stringify(body));
    
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // First verify the customer exists
    const { data: customer, error: fetchError } = await supabaseClient
      .from('client_customers')
      .select('generated_description_status')
      .eq('id', customerId)
      .single();

    if (fetchError) {
      console.error('Error fetching customer:', fetchError);
      throw fetchError;
    }
    
    if (!customer) {
      console.error('Customer not found:', customerId);
      throw new Error('Customer not found');
    }

    console.log('Current customer status:', customer.generated_description_status);

    // Validate the webhook payload
    if (!body || typeof body !== 'object') {
      console.error('Invalid webhook payload:', body);
      throw new Error('Invalid webhook payload format');
    }

    if (!body.lead_score || !body.use_case_summary || !Array.isArray(body.talking_points)) {
      console.error('Missing required fields in webhook payload:', body);
      throw new Error('Missing required fields in webhook payload');
    }

    // Update both status and description in a single operation
    const { error: updateError } = await supabaseClient
      .from('client_customers')
      .update({
        generated_description_status: 'generated',
        generated_description: body,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);

    if (updateError) {
      console.error('Error updating customer:', updateError);
      throw updateError;
    }

    console.log('Successfully updated customer data');

    // Verify the final state
    const { data: finalState, error: verifyError } = await supabaseClient
      .from('client_customers')
      .select('generated_description_status, generated_description')
      .eq('id', customerId)
      .single();

    if (verifyError) {
      console.error('Error verifying final state:', verifyError);
    } else {
      console.log('Final state:', JSON.stringify(finalState));
    }

    return new Response(
      JSON.stringify({ 
        message: 'Description updated successfully',
        customerId,
        status: 'generated',
        finalState
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);

    // If we have a customerId, update the status to failed
    if (customerId) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );

        const { error: updateError } = await supabaseClient
          .from('client_customers')
          .update({
            generated_description_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', customerId);

        if (updateError) {
          console.error('Error updating status to failed:', updateError);
        }
      } catch (updateError) {
        console.error('Error updating status to failed:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});