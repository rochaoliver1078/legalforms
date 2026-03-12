import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendNotification } from "@/lib/email";

// GET /api/submissions?form_id=xxx — List submissions for a form
export async function GET(req: NextRequest) {
  const db = createServerClient();
  const formId = req.nextUrl.searchParams.get("form_id");

  const query = db.from("submissions").select("*").order("submitted_at", { ascending: false });
  if (formId) query.eq("form_id", formId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/submissions — Submit form response (public, no auth needed)
export async function POST(req: NextRequest) {
  const db = createServerClient();
  const body = await req.json();

  if (!body.form_id) return NextResponse.json({ error: "form_id required" }, { status: 400 });

  // Save submission
  const { data: submission, error } = await db.from("submissions").insert({
    form_id: body.form_id,
    data: body.data || {},
    files: body.files || [],
    submitted_by: body.submitted_by || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get form to find notification emails
  const { data: form } = await db.from("forms").select("name, emails, fields").eq("id", body.form_id).single();

  // Send email notification (non-blocking)
  if (form?.emails?.length) {
    // Build a human-readable preview of the data
    const fields = form.fields || [];
    const preview: Record<string, string> = {};
    for (const f of fields) {
      if (body.data[f.id] && f.type !== "heading" && f.type !== "separator" && f.type !== "socios" && f.type !== "alt_events") {
        preview[f.label] = String(body.data[f.id]);
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://legalforms.vercel.app";

    sendNotification({
      to: form.emails,
      formName: form.name,
      submittedBy: body.submitted_by || "Cliente",
      submittedAt: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      previewData: preview,
      formUrl: `${appUrl}`,
    }).catch(console.error); // Don't block on email failure
  }

  return NextResponse.json(submission, { status: 201 });
}
