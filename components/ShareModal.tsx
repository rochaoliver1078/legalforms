"use client";
import { useState, useEffect } from "react";
import { Link2, Copy, X, Check, Mail, QrCode, Users, Send, Phone } from "lucide-react";
import { Form, Client } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";

interface ShareModalProps {
  form: Form;
  onClose: () => void;
  onUpdateEmails: (emails: string[]) => void;
  clients?: Client[];
}

export default function ShareModal({ form, onClose, onUpdateEmails, clients = [] }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showClients, setShowClients] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://legalforms.vercel.app";
  const shareLink = `${appUrl}/f/${form.id}`;
  const shareWpp = encodeURIComponent(`Olá! Preencha este formulário:\n📋 *${form.name}*\n🔗 ${shareLink}`);
  const shareMail = encodeURIComponent(`Olá!\n\nPreencha o formulário:\n📋 ${form.name}\n🔗 ${shareLink}\n\nObrigado!`);

  const copyLink = () => {
    navigator.clipboard?.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredClients = clients.filter(c => {
    if (!clientSearch) return true;
    return c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.phone || "").includes(clientSearch);
  });

  const sendToClientWpp = (client: Client) => {
    const phone = (client.phone || "").replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá ${client.name}! Preencha este formulário:\n📋 *${form.name}*\n🔗 ${shareLink}`);
    window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
  };

  const sendToClientMail = (client: Client) => {
    const subject = encodeURIComponent(form.name);
    const body = encodeURIComponent(`Olá ${client.name}!\n\nPreencha o formulário abaixo:\n📋 ${form.name}\n🔗 ${shareLink}\n\nObrigado!`);
    window.open(`mailto:${client.email}?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3>Compartilhar Formulário</h3>
          <button className="btn btn--icon btn--ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
          {/* Share Link */}
          <div className="share-link">
            <Link2 size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <span>{shareLink}</span>
            <button className="btn btn--sm" onClick={copyLink}>
              {copied ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar</>}
            </button>
          </div>

          {/* Share Buttons */}
          <div className="share-buttons">
            <a href={`https://wa.me/?text=${shareWpp}`} target="_blank" rel="noopener noreferrer" className="share-btn share-btn--whatsapp">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <a href={`mailto:?subject=${encodeURIComponent(form.name)}&body=${shareMail}`} className="share-btn share-btn--email">
              <Mail size={16} /> E-mail
            </a>
            <button className="share-btn share-btn--qr" onClick={() => setShowQR(!showQR)}>
              <QrCode size={16} /> QR Code
            </button>
          </div>

          {/* QR Code */}
          {showQR && (
            <div className="share-qr">
              <QRCodeSVG value={shareLink} size={200} bgColor="#ffffff" fgColor="#1a1a2e" level="M" />
            </div>
          )}

          {/* ── Send to Client ─────────────────────────────────── */}
          {clients.length > 0 && (
            <div className="share-email-config" style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>📤 Enviar para cliente</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Envie diretamente para um cliente cadastrado</div>
                </div>
                <button className="btn btn--sm" onClick={() => setShowClients(!showClients)}>
                  <Users size={14} /> {showClients ? "Fechar" : "Escolher"}
                </button>
              </div>
              {showClients && (
                <div>
                  <input className="input" value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Buscar cliente..." style={{ marginBottom: 8, fontSize: 13 }} />
                  <div style={{ maxHeight: 200, overflowY: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                    {filteredClients.map(c => (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--primary-bg)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.email || c.phone || "Sem contato"}</div>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {c.phone && (
                            <button className="btn btn--icon-sm" style={{ background: "#25d366", color: "#fff", borderColor: "#25d366", borderRadius: "var(--radius-sm)" }} onClick={() => sendToClientWpp(c)} title="WhatsApp">
                              <Send size={12} />
                            </button>
                          )}
                          {c.email && (
                            <button className="btn btn--icon-sm" style={{ background: "var(--info)", color: "#fff", borderColor: "var(--info)", borderRadius: "var(--radius-sm)" }} onClick={() => sendToClientMail(c)} title="E-mail">
                              <Mail size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredClients.length === 0 && <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)", fontSize: 12 }}>Nenhum cliente encontrado</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notification Emails */}
          <div className="share-email-config" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>📬 Notificações de resposta</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>E-mails que receberão aviso quando alguém preencher</div>
            <input
              className="input"
              value={(form.emails || []).join(", ")}
              onChange={(e) => onUpdateEmails(e.target.value.split(",").map((x) => x.trim()).filter(Boolean))}
              placeholder="email@empresa.com, outro@empresa.com"
            />
          </div>

          {/* Embed Code */}
          <div className="share-email-config" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>📋 Código Embed</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Incorpore o formulário em qualquer site</div>
            <textarea
              className="input"
              readOnly
              value={`<iframe src="${shareLink}" width="100%" height="700" frameborder="0" style="border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.1)"></iframe>`}
              rows={3}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
