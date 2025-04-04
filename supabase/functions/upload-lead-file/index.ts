// @deno-types="npm:@types/aws-sdk@2.7.0"
import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3.583.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

// IBM COS S3 Credentials from environment variables
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
  region: "auto",
  credentials: {
    accessKeyId: API_KEY_ID,
    secretAccessKey: SERVICE_INSTANCE_ID,
  },
  forcePathStyle: true,
});

// Initialize Supabase client with Service Role Key
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  // Validate environment variables
  const missingVars = [
    ["BUCKET_NAME", BUCKET_NAME],
    ["ENDPOINT", ENDPOINT],
    ["API_KEY_ID", API_KEY_ID],
    ["SERVICE_INSTANCE_ID", SERVICE_INSTANCE_ID],
    ["SUPABASE_URL", SUPABASE_URL],
    ["SERVICE_ROLE_KEY", SERVICE_ROLE_KEY],
  ].filter(([name, value]) => !value);

  if (missingVars.length > 0) {
    const missing = missingVars.map(([name]) => name).join(", ");
    console.error(`Missing environment variables: ${missing}`);
    return new Response(
      JSON.stringify({ 
        error: "Server configuration error", 
        details: `Missing required environment variables: ${missing}` 
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }

  try {
    // Validate Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    const jwt = authHeader.replace("Bearer ", "");

    // Validate user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError || !user) {
      console.error("User authentication error:", userError);
      throw new Error(userError?.message || "Invalid user token");
    }

    // Parse and validate form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const leadId = formData.get("leadId") as string | null;

    if (!file) {
      throw new Error("File not provided");
    }
    if (!leadId) {
      throw new Error("Lead ID not provided");
    }

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File size exceeds 50MB limit");
    }

    // Get file buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Construct file path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `leads/${leadId}/${timestamp}-${sanitizedFileName}`;

    console.log(`Starting upload for ${file.name} to ${BUCKET_NAME}/${filePath}`);

    // Upload to IBM COS
    try {
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: filePath,
        Body: fileBuffer,
        ContentType: file.type,
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      console.log(`Successfully uploaded ${file.name} to IBM COS`);
    } catch (cosError) {
      console.error("IBM COS upload error:", cosError);
      throw new Error("Failed to upload file to storage");
    }

    // Save to database
    try {
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
        console.error("Database insert error:", dbError);
        throw new Error("Failed to record file upload in database");
      }
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      throw new Error("Failed to save file metadata");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        filePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      }),
      {
        headers: corsHeaders,
        status: 200,
      }
    );

  } catch (error) {
    console.error("Upload process error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: error.message.includes("configuration") ? 500 : 400,
        headers: corsHeaders,
      }
    );
  }
});