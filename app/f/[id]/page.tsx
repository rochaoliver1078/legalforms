"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Check, ChevronRight, Upload, Star, ArrowLeft, Eye } from "lucide-react";
import { Form, FormField } from "@/lib/types";
import { createSocioFields, ALTERATION_EVENTS, fetchCEP, fetchCNPJ } from "@/lib/field-definitions";
import { getMask, validateCPF, validateCNPJ, cn } from "@/lib/utils";

const DRAFT_KEY = (id: string) => `lf_pub_draft_${id}`;

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
  const [phase, setPhase] = useState<"socio_picker" | "alt_picker" | "filling" | "review">("filling");
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; url: string }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"card" | "classic">("card");
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [cepData, setCepData] = useState<Record<string, string> | null>(null);
  const [cnpjData, setCnpjData] = useState<Record<string, string> | null>(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFileId, setActiveFileId] = useState("");

  useEffect(() => {
    if (!formId) return;
    fetch(`/api/forms?id=${formId}`)
      .then((r) => r.ok ? r.json() : Promise.reject("Formulário não encontrado"))
      .then((f: Form) => {
        setForm(f);
        if (f.settings?.defaultMode) setMode(f.settings.defaultMode);
        const hasSocios = f.fields.some((fld) => fld.type === "socios");
        const hasAlt = f.fields.some((fld) => fld.type === "alt_events");
        if (hasSocios) setPhase("socio_picker");
        else if (hasAlt) setPhase("alt_picker");
        // Load draft
        try { const saved = localStorage.getItem(DRAFT_KEY(f.id)); if (saved) { const d = JSON.parse(saved); setData(d.data || {}); } } catch {}
        setLoading(false);
      })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [formId]);

  // Auto-save
  useEffect(() => {
    if (form && Object.keys(data).length > 0) {
      try { localStorage.setItem(DRAFT_KEY(form.id), JSON.stringify({ data, step })); } catch {}
    }
  }, [data, step, form?.id]);

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>;
  if (error || !form) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif" }}><div style={{ background: "#fff", borderRadius: 20, padding: 36, maxWidth: 480, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}><h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Formulário não encontrado</h2><p style={{ color: "#888" }}>O link pode estar incorreto ou expirado.</p></div></div>;

  // Theme
  const t = form.theme || { primaryColor: "#FF6100", bgColor: "#fff8f0", cardBg: "#ffffff", textColor: "#1a1a2e", fontFamily: "Inter", borderRadius: "rounded" };
  const radius = t.borderRadius === "sharp" ? "4px" : t.borderRadius === "pill" ? "24px" : "14px";
  const hasLGPD = form.fields.some((f) => f.type === "lgpd");

  // Conditional visibility
  const isFieldVisible = (field: FormField): boolean => {
    if (!field.conditional?.fieldId) return true;
    const refVal = data[field.conditional.fieldId];
    const { operator, value } = field.conditional;
    let match = false;
    switch (operator) {
      case "equals": match = String(refVal) === value; break;
      case "not_equals": match = String(refVal) !== value; break;
      case "contains": match = String(refVal || "").includes(value); break;
      case "not_empty": match = !!refVal && String(refVal).length > 0; break;
      case "empty": match = !refVal || String(refVal).length === 0; break;
    }
    return field.conditional.action === "show" ? match : !match;
  };

  // Expand fields
  const getFillFields = (): FormField[] => {
    const all: FormField[] = [];
    form.fields.forEach((f) => {
      if (f.type === "socios") {
        for (let i = 1; i <= nSocios; i++) createSocioFields(i).forEach((sf) => all.push({ ...sf, _group: `Sócio ${i}` }));
      } else if (f.type === "alt_events") {
        altEvts.forEach((eid) => { const ev = ALTERATION_EVENTS.find((e) => e.id === eid); if (ev) ev.fields.forEach((ef) => all.push({ ...ef, _group: ev.label })); });
      } else all.push(f);
    });
    return all.filter((f) => isFieldVisible(f));
  };

  const fillFields = getFillFields();
  const fillable = fillFields.filter((f) => !["heading", "separator", "page_break"].includes(f.type));
  const curField = fillable[step];
  const total = fillable.length;
  const progress = total > 0 ? Math.round(((step + 1) / total) * 100) : 0;
  const setVal = (id: string, val: any) => setData((p) => ({ ...p, [id]: val }));
  const v = (id: string) => data[id] ?? "";

  const validateField = (field: FormField): string | null => {
    const val = data[field.id];
    if (field.required && (!val || (typeof val === "string" && !val.trim()))) return "Campo obrigatório";
    if (field.type === "cpf" && val && !validateCPF(val)) return "CPF inválido";
    if (field.type === "cnpj" && val && !validateCNPJ(val)) return "CNPJ inválido";
    if (field.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "E-mail inválido";
    return null;
  };

  const handleCepBlur = async (fieldId: string) => {
    const val = data[fieldId]?.replace(/\D/g, "");
    if (val?.length === 8) {
      setLoadingApi(true);
      const result = await fetchCEP(val);
      if (result) {
        setCepData(result);
        const nearby: Record<string, string> = {};
        form.fields.forEach((f) => {
          const l = f.label.toLowerCase();
          if (l.includes("logradouro") || l.includes("rua")) nearby[f.id] = result.logradouro || "";
          if (l.includes("bairro")) nearby[f.id] = result.bairro || "";
          if (l.includes("cidade") || l.includes("município")) nearby[f.id] = result.cidade || "";
          if (l === "uf" || l.includes("estado")) nearby[f.id] = result.uf || "";
        });
        setData((p) => ({ ...p, ...nearby }));
      }
      setLoadingApi(false);
    }
  };

  const handleCnpjSearch = async (fieldId: string) => {
    const val = data[fieldId]?.replace(/\D/g, "");
    if (val?.length === 14) {
      setLoadingApi(true);
      const result = await fetchCNPJ(val);
      if (result) setCnpjData(result);
      setLoadingApi(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeFileId) return;
    const fd = new FormData();
    fd.append("file", file); fd.append("form_id", formId); fd.append("field_id", activeFileId);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const result = await res.json();
      setUploadedFiles((p) => ({ ...p, [activeFileId]: { name: file.name, url: result.url } }));
      setVal(activeFileId, result.url);
    }
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    fillable.forEach((f) => { const e = validateField(f); if (e) errs[f.id] = e; });
    if (hasLGPD && !lgpdAccepted) errs["lgpd"] = "Aceite obrigatório";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await fetch("/api/submissions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_id: formId, data: { ...data, _files: uploadedFiles, _lgpd: lgpdAccepted }, submitted_by: data.resp || data.nome || data.resp_alt || data.resp_baixa || "Cliente" }),
      });
      localStorage.removeItem(DRAFT_KEY(form.id));
      setDone(true);
    } catch { alert("Erro ao enviar. Tente novamente."); }
    setSubmitting(false);
  };

  const confirmPicker = () => {
    if (phase === "socio_picker") { if (form.fields.some((f) => f.type === "alt_events")) setPhase("alt_picker"); else setPhase("filling"); }
    else setPhase("filling");
  };

  // Render input
  const renderInput = (field: FormField, large = false) => {
    const val = v(field.id);
    const mask = getMask(field.type);
    const err = errors[field.id];
    const inputStyle: React.CSSProperties = { width: "100%", padding: large ? "14px 16px" : "10px 14px", border: `2px solid ${err ? "#ef4444" : "#eee"}`, borderRadius: radius, fontSize: large ? 17 : 14, fontFamily: "inherit", outline: "none", background: "#fafafa", color: t.textColor, boxSizing: "border-box" };

    if (field.type === "lgpd") return (
      <div style={{ padding: 16, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: radius }}>
        <div onClick={() => setLgpdAccepted(!lgpdAccepted)} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${lgpdAccepted ? t.primaryColor : "#ddd"}`, background: lgpdAccepted ? t.primaryColor : "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>{lgpdAccepted && <Check size={14} />}</div>
          <span style={{ fontSize: 13 }}>{form.settings?.lgpdText || "Autorizo o uso dos meus dados conforme a LGPD."}</span>
        </div>
        {err && <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginTop: 4 }}>{err}</div>}
      </div>
    );

    if (field.type === "rating") {
      const max = field.maxRating || 5;
      return <div style={{ display: "flex", gap: 6 }}>{Array.from({ length: max }, (_, i) => (
        <Star key={i} size={large ? 32 : 24} fill={i < (val || 0) ? t.primaryColor : "none"} stroke={i < (val || 0) ? t.primaryColor : "#ddd"} style={{ cursor: "pointer" }} onClick={() => setVal(field.id, i + 1)} />
      ))}</div>;
    }

    if (field.type === "textarea") return <><textarea style={{ ...inputStyle, minHeight: large ? 120 : 80, resize: "vertical" }} value={val} onChange={(e) => setVal(field.id, e.target.value)} />{err && <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginTop: 4 }}>{err}</div>}</>;
    if (field.type === "select") return <><select style={inputStyle} value={val} onChange={(e) => setVal(field.id, e.target.value)}><option value="">Selecione...</option>{(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}</select>{err && <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginTop: 4 }}>{err}</div>}</>;

    if (field.type === "radio") return <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{(field.options || []).map((o) => (
      <div key={o} onClick={() => setVal(field.id, o)} style={{ padding: "12px 14px", border: `2px solid ${val === o ? t.primaryColor : "#eee"}`, borderRadius: radius, cursor: "pointer", fontWeight: 600, background: val === o ? t.primaryColor + "10" : "#fff", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${val === o ? t.primaryColor : "#ddd"}`, background: val === o ? t.primaryColor : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{val === o && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}</div>{o}
      </div>
    ))}{err && <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginTop: 4 }}>{err}</div>}</div>;

    if (field.type === "checkbox") return <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{(field.options || []).map((o) => {
      const checked = Array.isArray(val) && val.includes(o);
      return <div key={o} onClick={() => { const a = Array.isArray(val) ? [...val] : []; if (checked) setVal(field.id, a.filter((x: string) => x !== o)); else setVal(field.id, [...a, o]); }} style={{ padding: "12px 14px", border: `2px solid ${checked ? t.primaryColor : "#eee"}`, borderRadius: radius, cursor: "pointer", fontWeight: 600, background: checked ? t.primaryColor + "10" : "#fff", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${checked ? t.primaryColor : "#ddd"}`, background: checked ? t.primaryColor : "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{checked && <Check size={14} />}</div>{o}
      </div>;
    })}{err && <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginTop: 4 }}>{err}</div>}</div>;

    if (field.type === "file") return <>
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={handleFileUpload} />
      <div style={{ border: "2px dashed #ddd", borderRadius: radius, padding: 28, textAlign: "center", color: "#aaa", cursor: "pointer" }} onClick={() => { setActiveFileId(field.id); setTimeout(() => fileInputRef.current?.click(), 50); }}><Upload size={24} /><div>Clique para anexar</div><div style={{ fontSize: 11 }}>PDF, JPG, PNG (máx 10MB)</div></div>
      {uploadedFiles[field.id] && <div style={{ marginTop: 8, padding: 10, background: "#f0fdf4", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#059669" }}>✓ {uploadedFiles[field.id].name}</div>}
      {err && <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginTop: 4 }}>{err}</div>}
    </>;

    if (field.type === "cep_autofill" || field.type === "cep") return <>
      <input style={inputStyle} value={val} onChange={(e) => setVal(field.id, getMask("cep")!(e.target.value))} onBlur={() => handleCepBlur(field.id)} placeholder="00000-000" inputMode="numeric" autoFocus={large} />
      {loadingApi && <div style={{ fontSize: 12, color: t.primaryColor, marginTop: 4 }}>🔍 Buscando endereço...</div>}
      {cepData && <div style={{ fontSize: 12, color: "#059669", marginTop: 4 }}>✓ {cepData.logradouro}, {cepData.bairro} — {cepData.cidade}/{cepData.uf}</div>}
    </>;

    if (field.type === "cnpj_search") return <>
      <div style={{ display: "flex", gap: 8 }}>
        <input style={{ ...inputStyle, flex: 1 }} value={val} onChange={(e) => setVal(field.id, getMask("cnpj")!(e.target.value))} placeholder="00.000.000/0000-00" inputMode="numeric" />
        <button style={{ padding: "10px 16px", borderRadius: radius, border: "none", background: t.primaryColor, color: "#fff", fontWeight: 700, cursor: "pointer" }} onClick={() => handleCnpjSearch(field.id)} disabled={loadingApi}>{loadingApi ? "..." : "Buscar"}</button>
      </div>
      {cnpjData && <div style={{ fontSize: 12, background: "#f0fdf4", padding: 10, borderRadius: 8, marginTop: 6, lineHeight: 1.6 }}><strong>{cnpjData.razao_social}</strong><br/>{cnpjData.logradouro}, {cnpjData.numero} — {cnpjData.municipio}/{cnpjData.uf}<br/>Situação: {cnpjData.situacao}</div>}
    </>;

    return <>
      <input style={inputStyle} type={field.type === "email" ? "email" : field.type === "date" ? "date" : "text"}
        value={val} onChange={(e) => { const nv = mask ? mask(e.target.value) : e.target.value; setVal(field.id, nv); }}
        placeholder={field.placeholder || "Digite aqui..."} inputMode={["phone", "cpf", "cnpj", "cep", "number", "currency"].includes(field.type) ? "numeric" : undefined} autoFocus={large} />
      {field.type === "cpf" && val && !validateCPF(val) && val.replace(/\D/g, "").length >= 11 && <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginTop: 4 }}>CPF inválido</div>}
      {err && <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginTop: 4 }}>{err}</div>}
    </>;
  };

  // Done
  if (done) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: `linear-gradient(135deg, ${t.primaryColor}, ${t.primaryColor}cc)`, fontFamily: `'${t.fontFamily}', system-ui, sans-serif` }}>
      <div style={{ background: t.cardBg, borderRadius: radius, padding: 48, maxWidth: 480, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}>
        {form.theme?.logoUrl && <img src={form.theme.logoUrl} alt="Logo" style={{ height: 48, objectFit: "contain", margin: "0 auto 16px" }} />}
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: t.textColor }}>Formulário enviado!</h2>
        <p style={{ color: "#888", fontSize: 15 }}>{form.settings?.confirmationMessage || "Seus dados foram recebidos com sucesso. Obrigado!"}</p>
      </div>
    </div>
  );

  // Pickers
  if (phase === "socio_picker") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: `linear-gradient(135deg, ${t.primaryColor}, ${t.primaryColor}cc)`, fontFamily: `'${t.fontFamily}', system-ui, sans-serif` }}>
      <div style={{ background: t.cardBg, borderRadius: radius, padding: 36, maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.15)", textAlign: "center" }}>
        {form.theme?.logoUrl && <img src={form.theme.logoUrl} alt="Logo" style={{ height: 40, objectFit: "contain", margin: "0 auto 16px" }} />}
        <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: t.textColor }}>Quantos sócios?</div>
        <p style={{ color: "#888", marginBottom: 24 }}>Ficha completa para cada um.</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 20 }}>
          <button className="picker-btn" disabled={nSocios <= 1} onClick={() => setNSocios((s) => Math.max(1, s - 1))}>−</button>
          <div style={{ fontSize: 56, fontWeight: 900, color: t.primaryColor }}>{nSocios}</div>
          <button className="picker-btn" onClick={() => setNSocios((s) => Math.min(10, s + 1))}>+</button>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>{[1, 2, 3, 4, 5, 6].map((n) => (<button key={n} className={cn("picker-quick-btn", nSocios === n && "selected")} onClick={() => setNSocios(n)} style={{ borderColor: nSocios === n ? t.primaryColor : undefined }}>{n}</button>))}</div>
        <button style={{ width: "100%", padding: 14, borderRadius: radius, border: "none", background: t.primaryColor, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }} onClick={confirmPicker}>Continuar →</button>
      </div>
    </div>
  );

  if (phase === "alt_picker") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: `linear-gradient(135deg, ${t.primaryColor}, ${t.primaryColor}cc)`, fontFamily: `'${t.fontFamily}', system-ui, sans-serif` }}>
      <div style={{ background: t.cardBg, borderRadius: radius, padding: 36, maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}>
        {form.theme?.logoUrl && <img src={form.theme.logoUrl} alt="Logo" style={{ height: 40, objectFit: "contain", margin: "0 auto 16px" }} />}
        <div style={{ textAlign: "center", marginBottom: 16 }}><div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div><div style={{ fontSize: 24, fontWeight: 800, color: t.textColor }}>Quais alterações?</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {ALTERATION_EVENTS.map((ev) => {
            const on = altEvts.includes(ev.id);
            return <div key={ev.id} className={cn("picker-event", on && "selected")} onClick={() => setAltEvts((p) => on ? p.filter((x) => x !== ev.id) : [...p, ev.id])} style={{ borderColor: on ? t.primaryColor : undefined }}><div className="picker-event-check" style={{ background: on ? t.primaryColor : undefined }}>{on && <Check size={14} />}</div>{ev.label}</div>;
          })}
        </div>
        <button style={{ width: "100%", padding: 14, borderRadius: radius, border: "none", background: t.primaryColor, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }} onClick={confirmPicker}>Continuar →</button>
      </div>
    </div>
  );

  // Review
  if (phase === "review") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: `linear-gradient(135deg, ${t.primaryColor}, ${t.primaryColor}cc)`, fontFamily: `'${t.fontFamily}', system-ui, sans-serif` }}>
      <div style={{ background: t.cardBg, borderRadius: radius, padding: 36, maxWidth: 640, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.15)", maxHeight: "85vh", overflowY: "auto" }}>
        {form.theme?.logoUrl && <img src={form.theme.logoUrl} alt="Logo" style={{ height: 40, objectFit: "contain", margin: "0 auto 16px" }} />}
        <div style={{ fontSize: 20, fontWeight: 800, color: t.textColor, marginBottom: 4, textAlign: "center" }}>📋 Revisão</div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 20, textAlign: "center" }}>Confira antes de enviar</div>
        <div style={{ display: "grid", gap: 10 }}>
          {fillable.filter((f) => f.type !== "lgpd").map((f) => {
            const val = data[f.id]; if (!val && !f.required) return null;
            return <div key={f.id} style={{ padding: 12, background: "#f5f5fa", borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{typeof val === "string" && val.startsWith("http") ? "📎 Arquivo" : Array.isArray(val) ? val.join(", ") : String(val || "—")}</div>
            </div>;
          })}
        </div>
        {hasLGPD && renderInput({ id: "lgpd", type: "lgpd", label: "", required: true } as FormField)}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button style={{ flex: 1, padding: 14, borderRadius: radius, border: "1px solid #eee", background: "#f0f0f0", color: "#555", fontWeight: 700, fontSize: 15, cursor: "pointer" }} onClick={() => setPhase("filling")}>← Editar</button>
          <button style={{ flex: 1, padding: 14, borderRadius: radius, border: "none", background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }} onClick={handleSubmit} disabled={submitting}>{submitting ? "Enviando..." : "✓ Enviar"}</button>
        </div>
      </div>
    </div>
  );

  if (!curField && mode === "card") return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><p>Sem campos.</p></div>;

  // Classic Mode
  if (mode === "classic") return (
    <div style={{ minHeight: "100vh", background: t.bgColor, padding: "40px 20px", fontFamily: `'${t.fontFamily}', system-ui, sans-serif` }}>
      <div style={{ maxWidth: 680, margin: "0 auto", background: t.cardBg, borderRadius: radius, padding: 40, boxShadow: "0 8px 32px rgba(0,0,0,.08)" }}>
        {form.theme?.coverUrl && <img src={form.theme.coverUrl} alt="Cover" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: radius, marginBottom: 20 }} />}
        <div style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: `3px solid ${t.primaryColor}`, paddingBottom: 16, marginBottom: 24 }}>
          {form.theme?.logoUrl && <img src={form.theme.logoUrl} alt="Logo" style={{ height: 36, objectFit: "contain" }} />}
          <h1 style={{ fontSize: 22, fontWeight: 800, color: t.textColor, flex: 1 }}>{form.name}</h1>
          <button style={{ padding: "6px 12px", border: "1px solid #eee", borderRadius: radius, background: "transparent", fontSize: 12, cursor: "pointer" }} onClick={() => setMode("card")}>Modo card</button>
        </div>
        <div style={{ position: "relative", height: 6, borderRadius: 3, background: "#eee", marginBottom: 24 }}><div style={{ position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 3, background: t.primaryColor, width: `${progress}%`, transition: ".3s" }} /><span style={{ position: "absolute", right: 0, top: -18, fontSize: 11, fontWeight: 700, color: t.primaryColor }}>{progress}%</span></div>
        {fillFields.map((f) => {
          if (f.type === "heading") return <h3 key={f.id} style={{ fontSize: 18, fontWeight: 800, margin: "24px 0 12px", borderTop: "1px solid #f0f0f0", paddingTop: 16, color: t.textColor }}>{f.label}</h3>;
          if (f.type === "separator") return <hr key={f.id} style={{ border: "none", borderTop: "1px solid #eee", margin: "20px 0" }} />;
          if (f.type === "page_break") return <hr key={f.id} style={{ border: "none", borderTop: "2px dashed #3b82f6", margin: "28px 0" }} />;
          return <div key={f.id} style={{ marginBottom: 20 }}><label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: t.textColor }}>{f.label}{f.required && <span style={{ color: "#ef4444" }}>*</span>}</label>{f.description && <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>{f.description}</div>}{renderInput(f)}</div>;
        })}
        <div style={{ textAlign: "center", marginTop: 28, borderTop: "1px solid #eee", paddingTop: 20 }}>
          <button style={{ padding: "14px 40px", borderRadius: radius, border: "none", background: t.primaryColor, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }} onClick={() => setPhase("review")}>Revisar e Enviar →</button>
        </div>
      </div>
    </div>
  );

  // Card mode
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: `linear-gradient(135deg, ${t.primaryColor}, ${t.primaryColor}cc)`, fontFamily: `'${t.fontFamily}', system-ui, sans-serif` }}>
      <div style={{ background: t.cardBg, borderRadius: radius, padding: 36, maxWidth: 580, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}>
        {/* Logo */}
        {form.theme?.logoUrl && <img src={form.theme.logoUrl} alt="Logo" style={{ height: 36, objectFit: "contain", margin: "0 auto 16px", display: "block" }} />}
        {/* Cover */}
        {form.theme?.coverUrl && step === 0 && <img src={form.theme.coverUrl} alt="Cover" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: radius, marginBottom: 16 }} />}

        {/* Progress */}
        <div style={{ height: 5, borderRadius: 3, background: "#eee", marginBottom: 6 }}><div style={{ height: "100%", borderRadius: 3, background: t.primaryColor, width: `${progress}%`, transition: ".3s" }} /></div>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.primaryColor, textAlign: "right", marginBottom: 16 }}>{progress}% completo</div>

        {/* Mode toggle */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><button style={{ padding: "4px 10px", border: "1px solid #eee", borderRadius: radius, background: "transparent", fontSize: 11, cursor: "pointer" }} onClick={() => setMode("classic")}>Modo clássico</button></div>

        {curField._group && <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: t.primaryColor, letterSpacing: .5, marginBottom: 8 }}>📎 {curField._group}</div>}
        <div style={{ fontSize: 12, fontWeight: 700, color: t.primaryColor, textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>{form.name}</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, lineHeight: 1.3, color: t.textColor }}>{curField.label}{curField.required && <span style={{ color: "#ef4444" }}>*</span>}</div>
        {curField.description && <div style={{ fontSize: 13, color: "#999", marginBottom: 8 }}>{curField.description}</div>}
        <div style={{ fontSize: 13, color: "#999", marginBottom: 20 }}>Pergunta {step + 1} de {total}</div>

        {renderInput(curField, true)}

        <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
          {step > 0 && <button style={{ flex: 1, padding: 14, borderRadius: radius, border: "1px solid #eee", background: "#f0f0f0", color: "#555", fontWeight: 700, fontSize: 16, cursor: "pointer" }} onClick={() => { setStep((s) => s - 1); setErrors({}); }}>← Voltar</button>}
          {step < total - 1 && <button style={{ flex: 1, padding: 14, borderRadius: radius, border: "none", background: t.primaryColor, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }} onClick={() => {
            const err = validateField(curField);
            if (err && curField.required) { setErrors({ [curField.id]: err }); return; }
            setErrors({}); setStep((s) => s + 1);
          }}>Continuar →</button>}
          {step === total - 1 && <button style={{ flex: 1, padding: 14, borderRadius: radius, border: "none", background: t.primaryColor, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }} onClick={() => setPhase("review")}>Revisar ⇢</button>}
        </div>
      </div>
    </div>
  );
}
