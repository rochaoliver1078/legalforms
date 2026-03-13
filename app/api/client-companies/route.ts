import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const client_id = searchParams.get('client_id');
  const company_id = searchParams.get('company_id');

  if (client_id) {
    const { data, error } = await supabase
      .from('client_companies')
      .select('*, companies(*)')
      .eq('client_id', client_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  }

  if (company_id) {
    const { data, error } = await supabase
      .from('client_companies')
      .select('*, clients(*)')
      .eq('company_id', company_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  }

  const { data, error } = await supabase.from('client_companies').select('*, clients(*), companies(*)');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();
  const { client_id, company_id, role } = body;
  if (!client_id || !company_id) return NextResponse.json({ error: 'client_id and company_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('client_companies')
    .insert({ client_id, company_id, role: role || 'responsavel' })
    .select('*, clients(*), companies(*)')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await supabase.from('client_companies').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
