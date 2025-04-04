import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
      import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.583.0';
      import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

      const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // Allow requests from any origin
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      };

      // IBM COS S3 Credentials from environment variables (Supabase secrets)
      const BUCKET_NAME = Deno.env.get('IBM_COS_BUCKET_NAME')!;
      const ENDPOINT = Deno.env.get('IBM_COS_ENDPOINT')!;
      const API_KEY_ID = Deno.env.get('IBM_COS_API_KEY_ID')!;
      const SERVICE_INSTANCE_ID = Deno.env.get('IBM_COS_SERVICE_INSTANCE_ID')!;

      // Supabase details
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
      const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

      // Initialize S3 Client for IBM COS
      const s3Client = new S3Client({
        endpoint: `https://${ENDPOINT}`,
        region: 'auto', // IBM COS uses 'auto' or specific region like 'au-syd'
        credentials: {
          accessKeyId: API_KEY_ID,
          secretAccessKey: SERVICE_INSTANCE_ID, // Use Service Instance ID as Secret Access Key for IAM API Key auth
        },
        forcePathStyle: true, // Required for some S3 compatible services
      });

      // Initialize Supabase client with Service Role Key
      const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

      serve(async (req) => {
        // Handle CORS preflight requests
        if (req.method === 'OPTIONS') {
          return new Response(null, { status: 204, headers: corsHeaders });
        }

        // Check if required env vars are set
        if (!BUCKET_NAME || !ENDPOINT || !API_KEY_ID || !SERVICE_INSTANCE_ID || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
          console.error('Missing required environment variables');
          return new Response(JSON.stringify({ error: 'Server configuration error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
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

          // Construct file path (e.g., leads/{leadId}/{timestamp}-{fileName})
          const timestamp = Date.now();
          const filePath = `leads/${leadId}/${timestamp}-${file.name}`;

          // Prepare upload parameters
          const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: filePath,
            Body: file,
            ContentType: file.type,
            // ACL: 'public-read', // Uncomment if your bucket allows public reads and you want files public
          };

          // Upload file to IBM COS
          console.log(`Uploading ${file.name} to ${BUCKET_NAME}/${filePath}`);
          const command = new PutObjectCommand(uploadParams);
          await s3Client.send(command);
          console.log(`Successfully uploaded ${file.name}`);

          // Construct the public URL (adjust if your bucket isn't public or uses a different pattern)
          // Note: This assumes the bucket is public or you have a CDN/proxy setup.
          // For private buckets, you'd typically generate presigned URLs for access.
          const fileUrl = `https://${BUCKET_NAME}.${ENDPOINT}/${filePath}`;

          // Insert file metadata into Supabase table using service role
          const { error: dbError } = await supabaseAdmin
            .from('lead_files')
            .insert({
              lead_id: leadId,
              file_name: file.name,
              file_path: filePath, // Store the path/key used in COS
              file_size: file.size,
              mime_type: file.type,
              uploaded_by: user.id,
              // file_url: fileUrl, // Optionally store the direct URL if public
            });

          if (dbError) {
            console.error('Database insert error:', dbError);
            // Consider deleting the uploaded file from COS if DB insert fails (rollback)
            throw new Error('Failed to record file upload');
          }

          console.log(`File metadata saved for ${file.name}`);

          return new Response(JSON.stringify({ success: true, filePath, fileUrl }), {
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
