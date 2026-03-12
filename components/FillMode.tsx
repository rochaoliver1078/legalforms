"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Check, ChevronRight, Upload, X, Minus, Plus, Star, Edit3, Eye } from "lucide-react";
import { Form, FormField, ConditionalRule } from "@/lib/types";
import { createSocioFields, ALTERATION_EVENTS, fetchCEP, fetchCNPJ } from "@/lib/field-definitions";
import { getMask, validateCPF, validateCNPJ, cn } from "@/lib/utils";
import { api } from "@/lib/store";

interface FillModeProps { form: Form; onDone: () => void; onBack: () => void; }

const DRAFT_KEY = (id: string) => `lf_draft_${id}`;

export default function FillMode({ form, onDone, onBack }: FillModeProps) {
  const [data, setData] = useState<Record<string, any>>({});
  const [step, setStep] = useState(0);
  const [nSocios, setNSocios] = useState(2);
  const [altEvts, setAltEvts] = useState<string[]>([]);
  const [phase, setPhase] = useState<"socio_picker" | "alt_picker" | "filling" | "review" | "submitting">("filling");
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; url: string }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"card" | "classic">(form.settings?.defaultMode || "card");
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [cnpjData, setCnpjData] = useState<Record<string, string> | null>(null);
  const [cepData, setCepData] = useState<Record<string, string> | null>(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFileFieldId, setActiveFileFieldId] = useState<string>("");

  const theme = form.theme || { primaryColor: "#FF6100", bgColor: "#fff8f0", cardBg: "#ffffff", textColor: "#1a1a2e", fontFamily: "Inter", borderRadius: "rounded" };
  const hasSocios = form.fields.some((f) => f.type === "socios");
  const hasAltEvts = form.fields.some((f) => f.type === "alt_events");
  const hasLGPD = form.fields.some((f) => f.type === "lgpd");

  // Auto-load draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY(form.id));
      if (saved) { const d = JSON.parse(saved); setData(d.data || {}); }
    } catch {}
    if (hasSocios) setPhase("socio_picker");
    else if (hasAltEvts) setPhase("alt_picker");
  }, [form.id]);

  // Auto-save draft
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      try { localStorage.setItem(DRAFT_KEY(form.id), JSON.stringify({ data, step })); } catch {}
    }
  }, [data, step, form.id]);

  // Check conditional visibility
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

  // Validation
  const validateField = (field: FormField): string | null => {
    const val = data[field.id];
    if (field.required && (!val || (typeof val === "string" && !val.trim()))) return "Campo obrigatório";
    if (field.type === "cpf" && val && !validateCPF(val)) return "CPF inválido";
    if (field.type === "cnpj" && val && !validateCNPJ(val)) return "CNPJ inválido";
    if (field.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "E-mail inválido";
    return null;
  };

  // CEP auto-fill
  const handleCepBlur = async (fieldId: string) => {
    const val = data[fieldId]?.replace(/\D/g, "");
    if (val?.length === 8) {
      setLoadingApi(true);
      const result = await fetchCEP(val);
      if (result) {
        setCepData(result);
        // Auto-fill nearby fields
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

  // CNPJ search
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
    if (!file || !activeFileFieldId) return;
    const result = await api.uploadFile(file, form.id, activeFileFieldId);
    if (result) {
      setUploadedFiles((p) => ({ ...p, [activeFileFieldId]: { name: file.name, url: result.url } }));
      setVal(activeFileFieldId, result.url);
    }
  };

  const handleSubmit = async () => {
    // Validate all required fields
    const errs: Record<string, string> = {};
    fillable.forEach((f) => { const e = validateField(f); if (e) errs[f.id] = e; });
    if (hasLGPD && !lgpdAccepted) errs["lgpd"] = "Aceite obrigatório";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setPhase("submitting");
    await api.submitForm({
      form_id: form.id, data: { ...data, _files: uploadedFiles, _lgpd: lgpdAccepted },
      submitted_by: data.resp || data.nome || data.resp_alt || data.resp_baixa || "Cliente",
    });
    localStorage.removeItem(DRAFT_KEY(form.id));
    onDone();
  };

  const confirmPicker = () => {
    if (phase === "socio_picker") { if (hasAltEvts) setPhase("alt_picker"); else setPhase("filling"); }
    else setPhase("filling");
  };

  // Render a single field input
  const renderInput = (field: FormField, large = false) => {
    const val = v(field.id);
    const mask = getMask(field.type);
    const err = errors[field.id];
    const inputCls = cn("input", large && "input--lg", err && "input--error");

    if (field.type === "lgpd") {
      return (
        <div className="lgpd-box">
          <div className="lgpd-check" onClick={() => setLgpdAccepted(!lgpdAccepted)}>
            <div className={cn("lgpd-checkbox", lgpdAccepted && "checked")}>{lgpdAccepted && <Check size={14} />}</div>
            <span>{form.settings?.lgpdText || "Autorizo o uso dos meus dados conforme a Lei Geral de Proteção de Dados (LGPD) para fins de legalização empresarial."}</span>
          </div>
          {err && <div className="field-error">{err}</div>}
        </div>
      );
    }

    if (field.type === "rating") {
      const max = field.maxRating || 5;
      return (
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: max }, (_, i) => (
            <Star key={i} size={large ? 32 : 24} fill={i < (val || 0) ? theme.primaryColor : "none"}
              stroke={i < (val || 0) ? theme.primaryColor : "#ddd"} style={{ cursor: "pointer", transition: ".15s" }}
              onClick={() => setVal(field.id, i + 1)} />
          ))}
        </div>
      );
    }

    if (field.type === "textarea") return <><textarea className={inputCls} value={val} onChange={(e) => setVal(field.id, e.target.value)} placeholder={field.placeholder || ""} style={{ minHeight: large ? 120 : 80 }} />{err && <div className="field-error">{err}</div>}</>;
    if (field.type === "select") return <><select className={inputCls} value={val} onChange={(e) => setVal(field.id, e.target.value)}><option value="">Selecione...</option>{(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}</select>{err && <div className="field-error">{err}</div>}</>;

    if (field.type === "radio") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(field.options || []).map((o) => (
          <div key={o} className={cn("fill-option", val === o && "selected")} onClick={() => setVal(field.id, o)} style={{ borderColor: val === o ? theme.primaryColor : undefined }}>
            <div className="fill-radio-dot" style={{ borderColor: val === o ? theme.primaryColor : undefined, background: val === o ? theme.primaryColor : "#fff" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", opacity: val === o ? 1 : 0 }} />
            </div>{o}
          </div>
        ))}
        {err && <div className="field-error">{err}</div>}
      </div>
    );

    if (field.type === "checkbox") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(field.options || []).map((o) => {
          const checked = Array.isArray(val) && val.includes(o);
          return (
            <div key={o} className={cn("fill-option", checked && "selected")} onClick={() => { const a = Array.isArray(val) ? [...val] : []; if (checked) setVal(field.id, a.filter((x: string) => x !== o)); else setVal(field.id, [...a, o]); }}>
              <div className="fill-checkbox-box" style={{ borderColor: checked ? theme.primaryColor : undefined, background: checked ? theme.primaryColor : "#fff" }}>{checked && <Check size={14} />}</div>{o}
            </div>
          );
        })}
        {err && <div className="field-error">{err}</div>}
      </div>
    );

    if (field.type === "file") return (
      <>
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={handleFileUpload} />
        <div className="fill-upload" onClick={() => { setActiveFileFieldId(field.id); setTimeout(() => fileInputRef.current?.click(), 50); }}>
          <Upload size={28} /><div>Clique para anexar</div><div style={{ fontSize: 11 }}>PDF, JPG, PNG (máx 10MB)</div>
        </div>
        {uploadedFiles[field.id] && <div className="fill-upload-preview"><Check size={14} style={{ color: "var(--success)" }} /><span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{uploadedFiles[field.id].name}</span></div>}
        {err && <div className="field-error">{err}</div>}
      </>
    );

    if (field.type === "cep_autofill" || field.type === "cep") {
      return (
        <>
          <input className={inputCls} value={val} onChange={(e) => { setVal(field.id, getMask("cep")!(e.target.value)); }}
            onBlur={() => handleCepBlur(field.id)} placeholder="00000-000" inputMode="numeric" autoFocus={large} />
          {loadingApi && <div style={{ fontSize: 12, color: theme.primaryColor, marginTop: 4 }}>🔍 Buscando endereço...</div>}
          {cepData && <div style={{ fontSize: 12, color: "var(--success)", marginTop: 4 }}>✓ {cepData.logradouro}, {cepData.bairro} — {cepData.cidade}/{cepData.uf}</div>}
          {err && <div className="field-error">{err}</div>}
        </>
      );
    }

    if (field.type === "cnpj_search" || (field.type === "cnpj")) {
      return (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <input className={inputCls} style={{ flex: 1 }} value={val}
              onChange={(e) => setVal(field.id, getMask("cnpj")!(e.target.value))} placeholder="00.000.000/0000-00" inputMode="numeric" />
            {field.type === "cnpj_search" && <button className="btn btn--sm btn--primary" onClick={() => handleCnpjSearch(field.id)} disabled={loadingApi} style={{ background: theme.primaryColor }}>
              {loadingApi ? "..." : "Buscar"}
            </button>}
          </div>
          {cnpjData && <div style={{ fontSize: 12, background: "#f0fdf4", padding: 10, borderRadius: 8, marginTop: 6, lineHeight: 1.6 }}>
            <strong>{cnpjData.razao_social}</strong><br/>{cnpjData.logradouro}, {cnpjData.numero} — {cnpjData.municipio}/{cnpjData.uf}<br/>Situação: {cnpjData.situacao}
          </div>}
          {err && <div className="field-error">{err}</div>}
        </>
      );
    }

    // Default input
    return (
      <>
        <input className={inputCls}
          type={field.type === "email" ? "email" : field.type === "date" ? "date" : ["number", "currency"].includes(field.type) ? "text" : "text"}
          value={val} onChange={(e) => { const nv = mask ? mask(e.target.value) : e.target.value; setVal(field.id, nv); }}
          placeholder={field.placeholder || ""} inputMode={["phone", "cpf", "number", "currency"].includes(field.type) ? "numeric" : undefined} autoFocus={large} />
        {field.type === "cpf" && val && !validateCPF(val) && val.replace(/\D/g, "").length >= 11 && <div className="field-error">CPF inválido</div>}
        {err && <div className="field-error">{err}</div>}
      </>
    );
  };

  // --- PICKERS ---
  if (phase === "socio_picker") return (
    <div className="fill-wrap" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}cc)` }}>
      <div className="fill-card" style={{ background: theme.cardBg }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Quantos sócios?</div>
          <p style={{ color: "#888", marginBottom: 24 }}>Ficha completa para cada um.</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 20 }}>
            <button className="picker-btn" disabled={nSocios <= 1} onClick={() => setNSocios((s) => Math.max(1, s - 1))}>−</button>
            <div style={{ fontSize: 56, fontWeight: 900, color: theme.primaryColor }}>{nSocios}</div>
            <button className="picker-btn" onClick={() => setNSocios((s) => Math.min(10, s + 1))}>+</button>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (<button key={n} className={cn("picker-quick-btn", nSocios === n && "selected")} onClick={() => setNSocios(n)} style={{ borderColor: nSocios === n ? theme.primaryColor : undefined }}>{n}</button>))}
          </div>
          <button className="fill-btn fill-btn--next" style={{ width: "100%", background: theme.primaryColor }} onClick={confirmPicker}>Continuar <ChevronRight size={18} /></button>
        </div>
      </div>
    </div>
  );

  if (phase === "alt_picker") return (
    <div className="fill-wrap" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}cc)` }}>
      <div className="fill-card" style={{ background: theme.cardBg }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Quais alterações?</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {ALTERATION_EVENTS.map((ev) => {
            const on = altEvts.includes(ev.id);
            return (<div key={ev.id} className={cn("picker-event", on && "selected")} onClick={() => setAltEvts((p) => on ? p.filter((x) => x !== ev.id) : [...p, ev.id])} style={{ borderColor: on ? theme.primaryColor : undefined }}>
              <div className="picker-event-check" style={{ background: on ? theme.primaryColor : undefined }}>{on && <Check size={14} />}</div>{ev.label}
            </div>);
          })}
        </div>
        <button className="fill-btn fill-btn--next" style={{ width: "100%", background: theme.primaryColor }} onClick={confirmPicker}>Continuar <ChevronRight size={18} /></button>
      </div>
    </div>
  );

  // --- REVIEW SCREEN ---
  if (phase === "review") return (
    <div className="fill-wrap" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}cc)` }}>
      <div className="fill-card fill-card--review" style={{ background: theme.cardBg, maxWidth: 640 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>📋 Revisão</div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>Confira seus dados antes de enviar</div>
        <div className="review-grid">
          {fillable.filter((f) => f.type !== "lgpd").map((f) => {
            const val = data[f.id];
            if (!val && !f.required) return null;
            return (
              <div key={f.id} className="review-item">
                <div className="review-label">{f.label}</div>
                <div className="review-value">
                  {typeof val === "string" && val.startsWith("http") ? "📎 Arquivo anexado" :
                   Array.isArray(val) ? val.join(", ") : String(val || "—")}
                </div>
              </div>
            );
          })}
        </div>
        {hasLGPD && (
          <div className="lgpd-box" style={{ marginTop: 16 }}>
            <div className="lgpd-check" onClick={() => setLgpdAccepted(!lgpdAccepted)}>
              <div className={cn("lgpd-checkbox", lgpdAccepted && "checked")} style={{ background: lgpdAccepted ? theme.primaryColor : undefined }}>{lgpdAccepted && <Check size={14} />}</div>
              <span style={{ fontSize: 13 }}>{form.settings?.lgpdText || "Autorizo o uso dos meus dados conforme a LGPD."}</span>
            </div>
            {errors.lgpd && <div className="field-error">{errors.lgpd}</div>}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="fill-btn fill-btn--back" onClick={() => setPhase("filling")}><Edit3 size={16} /> Editar</button>
          <button className="fill-btn fill-btn--submit" style={{ background: "var(--success)" }} onClick={handleSubmit} disabled={phase as any === "submitting"}>
            <Check size={18} /> Enviar
          </button>
        </div>
      </div>
    </div>
  );

  if (!curField && mode === "card") return <div className="fill-wrap"><div className="fill-card"><p>Sem campos.</p></div></div>;

  // --- CLASSIC MODE ---
  if (mode === "classic") return (
    <div className="fill-wrap fill-wrap--classic" style={{ background: theme.bgColor }}>
      <div className="classic-form" style={{ background: theme.cardBg, fontFamily: theme.fontFamily }}>
        <div className="classic-header" style={{ borderColor: theme.primaryColor }}>
          <h1 style={{ color: theme.textColor }}>{form.name}</h1>
          <button className="btn btn--sm btn--ghost" onClick={() => setMode("card")}>Modo card</button>
        </div>
        <div className="classic-progress"><div className="classic-progress-bar" style={{ width: `${progress}%`, background: theme.primaryColor }} /><span>{progress}%</span></div>
        {fillFields.map((f) => {
          if (f.type === "heading") return <h3 key={f.id} className="classic-heading">{f.label}</h3>;
          if (f.type === "separator") return <hr key={f.id} className="classic-sep" />;
          if (f.type === "page_break") return <hr key={f.id} className="classic-page-break" />;
          return (
            <div key={f.id} className="classic-field">
              <label className="classic-label">{f.label}{f.required && <span style={{ color: "var(--danger)" }}>*</span>}</label>
              {f.description && <div className="classic-desc">{f.description}</div>}
              {renderInput(f)}
            </div>
          );
        })}
        <div className="classic-submit">
          <button className="fill-btn fill-btn--submit" style={{ background: theme.primaryColor }} onClick={() => setPhase("review")}>
            Revisar e Enviar <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  // --- CARD MODE ---
  return (
    <div className="fill-wrap" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}cc)` }}>
      <div className="fill-card animate-slide-in" style={{ background: theme.cardBg, fontFamily: theme.fontFamily }}>
        {/* Progress */}
        <div className="fill-progress-bar">
          <div className="fill-progress-fill" style={{ width: `${progress}%`, background: theme.primaryColor }} />
        </div>
        <div className="fill-progress-text" style={{ color: theme.primaryColor }}>{progress}% completo</div>

        {/* Mode toggle */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button className="btn btn--sm btn--ghost" style={{ fontSize: 11 }} onClick={() => setMode("classic")}>Modo clássico</button>
        </div>

        {/* Group label */}
        {curField._group && <div className="fill-group-label" style={{ color: theme.primaryColor }}>📎 {curField._group}</div>}

        {/* Question */}
        <div className="fill-label" style={{ color: theme.textColor }}>
          {curField.label}{curField.required && <span style={{ color: "var(--danger)", marginLeft: 4 }}>*</span>}
        </div>
        {curField.description && <div style={{ fontSize: 13, color: "#999", marginBottom: 8 }}>{curField.description}</div>}
        <div className="fill-sublabel">Pergunta {step + 1} de {total}</div>

        {renderInput(curField, true)}

        {/* Nav */}
        <div className="fill-nav">
          {step > 0 && <button className="fill-btn fill-btn--back" onClick={() => { setStep((s) => s - 1); setErrors({}); }}><ArrowLeft size={16} /> Voltar</button>}
          {step === 0 && <button className="fill-btn fill-btn--back" onClick={onBack}><ArrowLeft size={16} /> Sair</button>}
          {step < total - 1 && <button className="fill-btn fill-btn--next" style={{ background: theme.primaryColor }} onClick={() => {
            const err = validateField(curField);
            if (err && curField.required) { setErrors({ [curField.id]: err }); return; }
            setErrors({}); setStep((s) => s + 1);
          }}>Continuar <ChevronRight size={18} /></button>}
          {step === total - 1 && <button className="fill-btn fill-btn--next" style={{ background: theme.primaryColor }} onClick={() => setPhase("review")}>
            Revisar <Eye size={16} />
          </button>}
        </div>
      </div>
    </div>
  );
}
