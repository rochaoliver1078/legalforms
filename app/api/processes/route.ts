import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const client_id = searchParams.get('client_id');
  const company_id = searchParams.get('company_id');

  if (id) {
    const { data, error } = await supabase.from('processes').select('*').eq('id', id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  }

  let query = supabase.from('processes').select('*').order('updated_at', { ascending: false });
  if (client_id) query = query.eq('client_id', client_id);
  if (company_id) query = query.eq('company_id', company_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  const { data: process, error } = await supabase.from('processes').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create initial event
  await supabase.from('process_events').insert({
    process_id: process.id,
    type: 'created',
    description: `Processo "${process.title}" criado`,
  });

  return NextResponse.json(process, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();
  const { id, _event, ...rest } = body;

  const { data, error } = await supabase
    .from('processes')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If event info sent, create event
  if (_event) {
    await supabase.from('process_events').insert({
      process_id: id,
      type: _event.type || 'note',
      description: _event.description,
    });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerClient();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await supabase.from('processes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
