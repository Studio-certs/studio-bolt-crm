import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const EXTERNAL_API_URL = 'https://crewai-enterprise-lead-scoring.fly.dev/lead/analysis';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { customerId } = await req.json();

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get customer data
    const { data: customer, error: fetchError } = await supabaseClient
      .from('client_customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (fetchError) throw fetchError;
    if (!customer) throw new Error('Customer not found');

    // Construct webhook URL using environment variable
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/description-webhook?customerId=${customerId}`;

    // Prepare the request payload for the external API
    const apiPayload = {
      company: customer.name,
      product_name: "Enterprise CRM Solution",
      product_description: "A comprehensive customer relationship management platform designed for modern enterprises. It offers advanced lead tracking, customer engagement analytics, and AI-powered insights to help businesses build stronger relationships with their clients.",
      icp_description: "The ideal customer is a medium to large enterprise looking to modernize their customer relationship management processes. They typically have multiple departments handling customer interactions, need advanced analytics for decision making, and want to leverage AI to improve customer engagement and sales processes.",
      form_response: [
        {
          question: "Give a score for your experience?",
          answer: "9/10, very satisfied"
        }
      ],
      webhook_url: webhookUrl
    };

    // Make request to external API
    const response = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `Failed to initiate description generation: ${response.status} ${response.statusText}`
      );
    }

    // Update customer status to processing
    const { error: updateError } = await supabaseClient
      .from('client_customers')
      .update({
        generated_description_status: 'processing'
      })
      .eq('id', customerId);

    if (updateError) {
      console.error('Error updating status:', updateError);
      // Continue execution as the main operation succeeded
    }

    return new Response(
      JSON.stringify({ 
        message: 'Description generation initiated',
        customerId,
        status: 'processing'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);

    // Try to update customer status to failed if we have the ID
    try {
      const { customerId } = await req.json().catch(() => ({}));
      if (customerId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabaseClient
          .from('client_customers')
          .update({
            generated_description_status: 'failed'
          })
          .eq('id', customerId);
      }
    } catch (updateError) {
      console.error('Error updating status:', updateError);
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
