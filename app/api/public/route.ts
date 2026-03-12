import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Public REST API for LegalForms
// GET /api/public?action=form&id=...  — Get form
// GET /api/public?action=submissions&form_id=...  — Get submissions
// POST /api/public  { action: 'submit', form_id, data }  — Submit form

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');
  const formId = searchParams.get('form_id');

  if (action === 'form' && id) {
    const { data, error } = await supabase.from('forms').select('*').eq('id', id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  }

  if (action === 'submissions' && formId) {
    const { data, error } = await supabase.from('submissions').select('*').eq('form_id', formId).order('submitted_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (action === 'forms') {
    const { data, error } = await supabase.from('forms').select('id, name, icon, color, status, created_at, updated_at').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({
    api: 'LegalForms Public API',
    version: '2.0',
    endpoints: [
      'GET /api/public?action=forms — List all forms',
      'GET /api/public?action=form&id=UUID — Get a form',
      'GET /api/public?action=submissions&form_id=UUID — Get submissions',
      'POST /api/public — Submit form data { action: "submit", form_id, data }',
    ]
  });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  if (body.action === 'submit') {
    const { form_id, data, submitted_by } = body;
    if (!form_id || !data) return NextResponse.json({ error: 'form_id and data required' }, { status: 400 });
    
    const { data: result, error } = await supabase.from('submissions').insert({ form_id, data, submitted_by: submitted_by || 'API' }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(result, { status: 201 });
  }

  return NextResponse.json({ error: 'Invalid action. Use { action: "submit", form_id, data }' }, { status: 400 });
}
