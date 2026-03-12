"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, Upload, X, Minus, Plus } from "lucide-react";
import { Form, FormField } from "@/lib/types";
import { createSocioFields, ALTERATION_EVENTS } from "@/lib/field-definitions";
import { getMask, cn } from "@/lib/utils";

export default function PublicFormPage() {
  const params = useParams();
  const formId = params.id as string;
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, any>>({});
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nSocios, setNSocios] = useState(2);
  const [altEvts, setAltEvts] = useState<string[]>([]);
  const [phase, setPhase] = useState<"socio_picker" | "alt_picker" | "filling">("filling");
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; url: string }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!formId) return;
    fetch(`/api/forms?id=${formId}`)
      .then((r) => r.ok ? r.json() : Promise.reject("Formulário não encontrado"))
      .then((f: Form) => {
        setForm(f);
        const hasSocios = f.fields.some((fld) => fld.type === "socios");
        const hasAlt = f.fields.some((fld) => fld.type === "alt_events");
        if (hasSocios) setPhase("socio_picker");
        else if (hasAlt) setPhase("alt_picker");
        setLoading(false);
      })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [formId]);

  if (loading) return <div style={styles.center}><div className="spinner" style={{ margin: "0 auto" }} /></div>;
  if (error || !form) return <div style={styles.center}><div style={styles.card}><h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Formulário não encontrado</h2><p style={{ color: "#888" }}>O link pode estar incorreto ou expirado.</p></div></div>;

  // Expand smart fields
  const getFillFields = (): FormField[] => {
    const all: FormField[] = [];
    form.fields.forEach((f) => {
      if (f.type === "socios") {
        for (let i = 1; i <= nSocios; i++) createSocioFields(i).forEach((sf) => all.push({ ...sf, _group: `Sócio ${i}${i === 1 ? " (Admin)" : ""}` }));
      } else if (f.type === "alt_events") {
        altEvts.forEach((eid) => { const ev = ALTERATION_EVENTS.find((e) => e.id === eid); if (ev) ev.fields.forEach((ef) => all.push({ ...ef, _group: ev.label })); });
      } else all.push(f);
    });
    return all;
  };

  const fillFields = getFillFields();
  const fillable = fillFields.filter((f) => !["heading", "separator", "socios", "alt_events"].includes(f.type));
  const curField = fillable[step];
  const total = fillable.length;
  const v = data[curField?.id] ?? "";
  const mask = curField ? getMask(curField.type) : null;

  const setVal = (val: any) => setData((p) => ({ ...p, [curField.id]: val }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_id: formId, data: { ...data, _files: uploadedFiles }, submitted_by: data.resp || data.nome || data.resp_alt || data.resp_baixa || "Cliente" }),
      });
      setDone(true);
    } catch { alert("Erro ao enviar. Tente novamente."); }
    setSubmitting(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !curField) return;
    const fd = new FormData();
    fd.append("file", file); fd.append("form_id", formId); fd.append("field_id", curField.id);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const result = await res.json();
      setUploadedFiles((p) => ({ ...p, [curField.id]: { name: file.name, url: result.url } }));
      setVal(result.url);
    }
  };

  const confirmPicker = () => {
    if (phase === "socio_picker") {
      if (form.fields.some((f) => f.type === "alt_events")) setPhase("alt_picker");
      else setPhase("filling");
    } else setPhase("filling");
  };

  // Done
  if (done) return (
    <div style={styles.wrap}>
      <div style={{ ...styles.card, textAlign: "center", padding: "48px 32px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Formulário enviado!</h2>
        <p style={{ color: "#888", fontSize: 15 }}>Seus dados foram recebidos com sucesso. Obrigado!</p>
      </div>
    </div>
  );

  // Socio Picker
  if (phase === "socio_picker") return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Quantos sócios?</div>
          <p style={{ color: "#888", marginBottom: 24 }}>Para cada sócio será exibida uma ficha completa.</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 20 }}>
            <button style={styles.pickerBtn} disabled={nSocios <= 1} onClick={() => setNSocios((s) => Math.max(1, s - 1))}>−</button>
            <div style={{ fontSize: 56, fontWeight: 900, color: "#FF6100" }}>{nSocios}</div>
            <button style={styles.pickerBtn} onClick={() => setNSocios((s) => Math.min(10, s + 1))}>+</button>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button key={n} onClick={() => setNSocios(n)} style={{ ...styles.quickBtn, ...(nSocios === n ? { borderColor: "#FF6100", background: "#fff8f0", color: "#FF6100" } : {}) }}>{n}</button>
            ))}
          </div>
          <button style={styles.nextBtn} onClick={confirmPicker}>Continuar →</button>
        </div>
      </div>
    </div>
  );

  // Alt Events Picker
  if (phase === "alt_picker") return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Quais alterações?</div>
          <p style={{ color: "#888", marginBottom: 24 }}>Marque todas que se aplicam.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {ALTERATION_EVENTS.map((ev) => {
            const on = altEvts.includes(ev.id);
            return (
              <div key={ev.id} onClick={() => setAltEvts((p) => on ? p.filter((x) => x !== ev.id) : [...p, ev.id])}
                style={{ padding: "12px 14px", border: `2px solid ${on ? "#FF6100" : "#eee"}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14, background: on ? "#fff8f0" : "#fff", display: "flex", alignItems: "center", gap: 10, transition: ".12s" }}>
                <div style={{ width: 22, height: 22, border: `2px solid ${on ? "#FF6100" : "#ddd"}`, borderRadius: 6, background: on ? "#FF6100" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                  {on && "✓"}
                </div>
                {ev.label}
              </div>
            );
          })}
        </div>
        {altEvts.length > 0 && <p style={{ textAlign: "center", fontSize: 13, color: "#00B67A", fontWeight: 700, marginBottom: 14 }}>✓ {altEvts.length} selecionada(s)</p>}
        <button style={styles.nextBtn} onClick={confirmPicker}>Continuar →</button>
      </div>
    </div>
  );

  if (!curField) return <div style={styles.center}><p>Este formulário não tem campos.</p></div>;

  // Card Fill
  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={{ display: "flex", gap: 3, marginBottom: 20 }}>
          {fillable.map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? "#FF6100" : "#eee", transition: ".3s" }} />)}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#FF6100", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>{form.name}</div>
        {curField._group && <div style={{ fontSize: 12, fontWeight: 700, color: "#FF6100", marginBottom: 8 }}>📎 {curField._group}</div>}
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, lineHeight: 1.3 }}>
          {curField.label}{curField.required && <span style={{ color: "#e53" }}>*</span>}
        </div>
        <div style={{ fontSize: 13, color: "#999", marginBottom: 20 }}>Pergunta {step + 1} de {total}</div>

        {/* Input */}
        {curField.type === "textarea" && <textarea style={{ ...styles.input, minHeight: 100 }} value={v} onChange={(e) => setVal(e.target.value)} placeholder={curField.placeholder || "Digite aqui..."} />}
        {curField.type === "select" && <select style={styles.input} value={v} onChange={(e) => setVal(e.target.value)}><option value="">Selecione...</option>{(curField.options || []).map((o) => <option key={o} value={o}>{o}</option>)}</select>}
        {curField.type === "radio" && <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{(curField.options || []).map((o) => (
          <div key={o} onClick={() => setVal(o)} style={{ padding: "14px 16px", border: `2px solid ${v === o ? "#FF6100" : "#eee"}`, borderRadius: 12, cursor: "pointer", fontWeight: 600, background: v === o ? "#fff8f0" : "#fff", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${v === o ? "#FF6100" : "#ddd"}`, background: v === o ? "#FF6100" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {v === o && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
            </div>{o}
          </div>
        ))}</div>}
        {curField.type === "file" && (
          <>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={handleFileUpload} />
            <div style={{ border: "2px dashed #ddd", borderRadius: 12, padding: 32, textAlign: "center", color: "#aaa", cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
              📎 Toque para anexar arquivo<br /><span style={{ fontSize: 12 }}>PDF, JPG, PNG (máx 10MB)</span>
            </div>
            {uploadedFiles[curField.id] && <div style={{ marginTop: 8, padding: 10, background: "#f0fdf4", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#059669" }}>✓ {uploadedFiles[curField.id].name}</div>}
          </>
        )}
        {!["textarea", "select", "radio", "file"].includes(curField.type) && (
          <input style={styles.input}
            type={curField.type === "email" ? "email" : curField.type === "date" ? "date" : ["number", "currency"].includes(curField.type) ? "number" : "text"}
            value={v} onChange={(e) => { const val = mask ? mask(e.target.value) : e.target.value; setVal(val); }}
            placeholder={curField.placeholder || "Digite aqui..."}
            inputMode={["phone", "cpf", "cnpj", "cep", "number", "currency"].includes(curField.type) ? "numeric" : undefined}
            autoFocus
          />
        )}

        {/* Nav */}
        <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
          {step > 0 && <button style={{ ...styles.btn, background: "#f0f0f0", color: "#555" }} onClick={() => setStep((s) => s - 1)}>← Voltar</button>}
          {step < total - 1 && <button style={styles.nextBtn} onClick={() => setStep((s) => s + 1)}>Continuar →</button>}
          {step === total - 1 && <button style={{ ...styles.btn, background: "#00B67A", color: "#fff" }} onClick={handleSubmit} disabled={submitting}>{submitting ? "Enviando..." : "✓ Enviar"}</button>}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "linear-gradient(135deg,#FF6100 0%,#ff8a3d 50%,#ffb347 100%)", fontFamily: "'Inter', system-ui, sans-serif" },
  card: { background: "#fff", borderRadius: 20, padding: 36, maxWidth: 580, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.15)", minHeight: 300 },
  center: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" },
  input: { width: "100%", padding: "14px 16px", border: "2px solid #eee", borderRadius: 12, fontSize: 17, fontFamily: "inherit", outline: "none", background: "#fafafa", color: "#1a1a2e", boxSizing: "border-box" as const },
  btn: { flex: 1, padding: 14, borderRadius: 12, border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  nextBtn: { flex: 1, padding: 14, borderRadius: 12, border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: "#FF6100", color: "#fff", width: "100%" },
  pickerBtn: { width: 48, height: 48, borderRadius: "50%", border: "2px solid #ddd", background: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  quickBtn: { padding: "10px 20px", borderRadius: 10, border: "2px solid #eee", background: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" },
};
