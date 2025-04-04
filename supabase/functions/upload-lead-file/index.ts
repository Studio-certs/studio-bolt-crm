import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3.583.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// IBM COS S3 Credentials
const BUCKET_NAME = Deno.env.get("IBM_COS_BUCKET_NAME")!;
const ENDPOINT = Deno.env.get("IBM_COS_ENDPOINT")!;
const API_KEY_ID = Deno.env.get("IBM_COS_API_KEY_ID")!;
const SERVICE_INSTANCE_ID = Deno.env.get("IBM_COS_SERVICE_INSTANCE_ID")!;

// Supabase details
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Initialize S3 Client for IBM COS
const s3Client = new S3Client({
  endpoint: `https://${ENDPOINT}`,
  region: "au-syd",
  credentials: {
    accessKeyId: API_KEY_ID,
    secretAccessKey: SERVICE_INSTANCE_ID,
  },
  forcePathStyle: true,
});

// Initialize Supabase client
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Verify auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    const token = authHeader.replace("Bearer ", "");

    // Get user from token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Invalid authentication token");
    }

    // Get form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const leadId = formData.get("leadId") as string | null;

    if (!file || !leadId) {
      throw new Error("Missing required fields: file and leadId");
    }

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File size exceeds 50MB limit");
    }

    // Generate safe filename and path
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `leads/${leadId}/${timestamp}-${safeFileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log(`Starting upload to IBM COS: ${filePath}`);

    // Upload to IBM COS
    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filePath,
        Body: buffer,
        ContentType: file.type,
        ACL: "public-read",
      });

      await s3Client.send(uploadCommand);
      console.log("File uploaded to IBM COS successfully");

      // Generate public URL
      const publicUrl = `https://${BUCKET_NAME}.${ENDPOINT}/${filePath}`;

      // Save file metadata to Supabase
      const { error: dbError } = await supabaseAdmin
        .from("lead_files")
        .insert({
          lead_id: leadId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
        });

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          filePath,
          publicUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );

    } catch (uploadError) {
      console.error("IBM COS upload error:", uploadError);
      throw new Error("Failed to upload file to IBM Cloud Storage");
    }

  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: error.message?.includes("Authorization") ? 401 : 400,
      }
    );
  }
});