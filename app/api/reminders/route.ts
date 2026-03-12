import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/reminders — Send reminder email to a client
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { client_email, client_name, form_name, form_url, message } = body;

  if (!client_email || !form_name) {
    return NextResponse.json({ error: 'client_email and form_name required' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'LegalForms <onboarding@resend.dev>',
        to: [client_email],
        subject: `Lembrete: ${form_name} — Formulário pendente`,
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #FF6100; font-size: 24px; margin: 0;">LegalForms</h1>
            </div>
            <div style="background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 28px;">
              <h2 style="color: #1a1a2e; font-size: 20px; margin-bottom: 8px;">Olá, ${client_name || 'Cliente'}!</h2>
              <p style="color: #666; font-size: 15px; line-height: 1.6;">
                ${message || `Você tem um formulário pendente: <strong>${form_name}</strong>. Por favor, preencha o quanto antes para darmos continuidade ao seu processo.`}
              </p>
              ${form_url ? `<a href="${form_url}" style="display: inline-block; margin-top: 16px; padding: 12px 28px; background: #FF6100; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700;">Preencher Formulário</a>` : ''}
            </div>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 16px;">Enviado via LegalForms</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.message || 'Failed to send' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Reminder sent' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
