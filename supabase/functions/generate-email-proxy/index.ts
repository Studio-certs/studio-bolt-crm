import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

    // Define CORS headers - Allow requests from any origin (*) or specify your Netlify domain
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Or 'https://studio-crm.netlify.app' for production
      'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS
      'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Allow necessary headers
    };

    // Get the target API URL from environment variables
    const EXTERNAL_API_URL = Deno.env.get('VITE_EMAIL_GENERATION_API_URL');

    serve(async (req) => {
      // --- Handle CORS Preflight Request ---
      // Browsers send an OPTIONS request first to check CORS permissions
      if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      // --- Handle Actual POST Request ---
      if (req.method === 'POST') {
        if (!EXTERNAL_API_URL) {
          console.error("VITE_EMAIL_GENERATION_API_URL is not set in Supabase function environment variables.");
          return new Response(JSON.stringify({ error: 'Internal server configuration error.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        try {
          // 1. Get the data sent from the frontend modal
          const requestBody = await req.json();

          // 2. Make the request to the external AI API
          const apiResponse = await fetch(EXTERNAL_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody), // Forward the data
          });

          // 3. Check the external API's response status
          if (!apiResponse.ok) {
            // Try to get error details from the external API response
            let errorDetail = `External API Error: ${apiResponse.status} ${apiResponse.statusText}`;
            try {
              const errorBody = await apiResponse.json();
              errorDetail = errorBody.detail || errorBody.message || errorDetail;
            } catch (_) { /* Ignore if error body isn't JSON */ }

            console.error("External API Error:", errorDetail);
            // Return the external API's error status and message back to the frontend
            return new Response(JSON.stringify({ error: errorDetail }), {
              status: apiResponse.status, // Forward the original error status
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // 4. Get the successful response body from the external API
          const responseBody = await apiResponse.json();

          // 5. Send the successful response back to the frontend
          return new Response(JSON.stringify(responseBody), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        } catch (error) {
          console.error('Proxy Function Error:', error);
          return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred in the proxy.' }), {
            status: 500, // Internal Server Error for proxy issues
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // --- Handle other methods (GET, PUT, etc.) ---
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    });
