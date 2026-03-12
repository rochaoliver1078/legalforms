import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// POST /api/upload — Upload a file to Supabase Storage
export async function POST(req: NextRequest) {
  const db = createServerClient();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const formId = formData.get("form_id") as string;
  const fieldId = formData.get("field_id") as string;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  // Validate file type
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  // Generate unique path
  const ext = file.name.split(".").pop() || "bin";
  const path = `${formId}/${Date.now()}_${fieldId}.${ext}`;

  // Upload to Supabase Storage
  const buffer = await file.arrayBuffer();
  const { data, error } = await db.storage
    .from("documents")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate signed URL (valid for 7 days)
  const { data: urlData } = await db.storage
    .from("documents")
    .createSignedUrl(data.path, 60 * 60 * 24 * 7);

  return NextResponse.json({
    path: data.path,
    url: urlData?.signedUrl,
    name: file.name,
    size: file.size,
  });
}
