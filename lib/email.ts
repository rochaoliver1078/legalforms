import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface NotifyPayload {
  to: string[];
  formName: string;
  submittedBy: string;
  submittedAt: string;
  previewData: Record<string, string>;
  formUrl: string;
}

export async function sendNotification(payload: NotifyPayload) {
  const { to, formName, submittedBy, submittedAt, previewData, formUrl } = payload;

  if (!to.length) return { success: false, error: "No recipients" };

  // Build a simple data preview (first 8 fields)
  const entries = Object.entries(previewData).slice(0, 8);
  const dataRows = entries
    .map(([key, val]) => `<tr><td style="padding:6px 12px;color:#666;font-size:13px">${key}</td><td style="padding:6px 12px;font-size:13px;font-weight:600">${val}</td></tr>`)
    .join("");

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto">
      <div style="background:#FF6100;padding:20px 24px;border-radius:12px 12px 0 0">
        <h2 style="color:#fff;margin:0;font-size:18px">📋 Nova resposta: ${formName}</h2>
      </div>
      <div style="background:#fff;border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 12px 12px">
        <p style="color:#666;font-size:14px;margin:0 0 16px">
          Preenchido por <strong>${submittedBy || "Anônimo"}</strong> em ${submittedAt}
        </p>
        ${entries.length > 0 ? `
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
            <thead><tr><td style="padding:6px 12px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.5px">Campo</td><td style="padding:6px 12px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.5px">Resposta</td></tr></thead>
            <tbody>${dataRows}</tbody>
          </table>
        ` : ""}
        <a href="${formUrl}" style="display:inline-block;background:#FF6100;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600">
          Ver resposta completa →
        </a>
        <p style="color:#bbb;font-size:12px;margin:20px 0 0">Enviado por LegalForms</p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: "LegalForms <onboarding@resend.dev>",
      to,
      subject: `Nova resposta: ${formName}`,
      html,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
