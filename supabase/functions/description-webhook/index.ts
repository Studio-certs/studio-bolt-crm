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
    const body = await req.json();
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First verify the customer exists and is in processing state
    const { data: customer, error: fetchError } = await supabaseClient
      .from('client_customers')
      .select('generated_description_status')
      .eq('id', customerId)
      .single();

    if (fetchError) throw fetchError;
    if (!customer) throw new Error('Customer not found');

    // Only proceed if the customer is in processing state
    if (customer.generated_description_status !== 'processing') {
      throw new Error(`Invalid status transition from ${customer.generated_description_status}`);
    }

    // Update customer with generated description
    const { error: updateError } = await supabaseClient
      .from('client_customers')
      .update({
        generated_description: body,
        generated_description_status: 'generated',
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ message: 'Description updated successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);

    // If we have a customerId, update the status to failed
    if (customerId) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabaseClient
          .from('client_customers')
          .update({
            generated_description_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', customerId);
      } catch (updateError) {
        console.error('Error updating status:', updateError);
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