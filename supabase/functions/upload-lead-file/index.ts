import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Supabase details
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Initialize Supabase client with Service Role Key
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    const jwt = authHeader.replace('Bearer ', '');

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError || !user) {
      console.error('User fetch error:', userError);
      throw new Error('Invalid user token');
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const leadId = formData.get('leadId') as string | null;

    if (!file) {
      throw new Error('File not provided');
    }
    if (!leadId) {
      throw new Error('Lead ID not provided');
    }

    // Create new FormData for external API
    const apiFormData = new FormData();
    apiFormData.append('documentFile', file);

    // Call external API
    const apiResponse = await fetch('https://studio-certs-be-dev.fly.dev/api/upload/uploadDocument', {
      method: 'POST',
      body: apiFormData,
    });

    if (!apiResponse.ok) {
      throw new Error(`External API error: ${apiResponse.status} ${apiResponse.statusText}`);
    }

    const apiData = await apiResponse.json();

    if (apiData.statusCode !== 200 || !apiData.data?.documentFileUrl?.original) {
      throw new Error('Invalid response from external API');
    }

    const fileUrl = apiData.data.documentFileUrl.original;

    // Insert file metadata into Supabase table using service role
    const { error: dbError } = await supabaseAdmin
      .from('lead_files')
      .insert({
        lead_id: leadId,
        file_name: file.name,
        file_path: fileUrl, // Store the external URL instead of local path
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      throw new Error('Failed to record file upload');
    }

    console.log(`File metadata saved for ${file.name}`);

    return new Response(JSON.stringify({ 
      success: true, 
      fileUrl,
      fileName: file.name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});