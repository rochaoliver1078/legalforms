import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/forms — List all forms
// GET /api/forms?id=xxx — Get single form
export async function GET(req: NextRequest) {
  const db = createServerClient();
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const { data, error } = await db.from("forms").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  }

  const { data, error } = await db.from("forms").select("*, submissions(count)").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten submission count
  const forms = (data || []).map((f: any) => ({
    ...f,
    response_count: f.submissions?.[0]?.count || 0,
    submissions: undefined,
  }));

  return NextResponse.json(forms);
}

// POST /api/forms — Create new form
export async function POST(req: NextRequest) {
  const db = createServerClient();
  const body = await req.json();

  const { data, error } = await db.from("forms").insert({
    name: body.name || "Novo Formulário",
    icon: body.icon || "📋",
    color: body.color || "#FF6100",
    fields: body.fields || [],
    emails: body.emails || [],
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PUT /api/forms — Update form
export async function PUT(req: NextRequest) {
  const db = createServerClient();
  const body = await req.json();

  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await db.from("forms").update({
    name: body.name,
    icon: body.icon,
    color: body.color,
    fields: body.fields,
    emails: body.emails,
  }).eq("id", body.id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/forms?id=xxx
export async function DELETE(req: NextRequest) {
  const db = createServerClient();
  const id = req.nextUrl.searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await db.from("forms").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
