"use client";
import { useState, useRef, useCallback } from "react";
import { ArrowLeft, Check, ChevronRight, Upload, X, Minus, Plus } from "lucide-react";
import { Form, FormField } from "@/lib/types";
import { createSocioFields, ALTERATION_EVENTS } from "@/lib/field-definitions";
import { getMask, cn } from "@/lib/utils";
import { api } from "@/lib/store";

interface FillModeProps {
  form: Form;
  onDone: () => void;
  onBack: () => void;
}

export default function FillMode({ form, onDone, onBack }: FillModeProps) {
  const [data, setData] = useState<Record<string, any>>({});
  const [step, setStep] = useState(0);
  const [nSocios, setNSocios] = useState(2);
  const [altEvts, setAltEvts] = useState<string[]>([]);
  const [phase, setPhase] = useState<"socio_picker" | "alt_picker" | "filling" | "submitting">("filling");
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; url: string }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasSocios = form.fields.some((f) => f.type === "socios");
  const hasAltEvts = form.fields.some((f) => f.type === "alt_events");

  // Initialize pickers
  useState(() => {
    if (hasSocios) setPhase("socio_picker");
    else if (hasAltEvts) setPhase("alt_picker");
  });

  // Expand smart fields into real fill steps
  const getFillFields = (): FormField[] => {
    const all: FormField[] = [];
    form.fields.forEach((f) => {
      if (f.type === "socios") {
        for (let i = 1; i <= nSocios; i++) {
          createSocioFields(i).forEach((sf) => all.push({ ...sf, _group: `Sócio ${i}${i === 1 ? " (Admin)" : ""}` }));
        }
      } else if (f.type === "alt_events") {
        altEvts.forEach((eid) => {
          const ev = ALTERATION_EVENTS.find((e) => e.id === eid);
          if (ev) ev.fields.forEach((ef) => all.push({ ...ef, _group: ev.label }));
        });
      } else {
        all.push(f);
      }
    });
    return all;
  };

  const fillFields = getFillFields();
  const fillable = fillFields.filter((f) => f.type !== "heading" && f.type !== "separator" && f.type !== "socios" && f.type !== "alt_events");
  const curField = fillable[step];
  const total = fillable.length;

  const setVal = (val: any) => setData((p) => ({ ...p, [curField.id]: val }));
  const v = data[curField?.id] ?? "";
  const mask = curField ? getMask(curField.type) : null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !curField) return;
    const result = await api.uploadFile(file, form.id, curField.id);
    if (result) {
      setUploadedFiles((p) => ({ ...p, [curField.id]: { name: file.name, url: result.url } }));
      setVal(result.url);
    }
  };

  const handleSubmit = async () => {
    setPhase("submitting");
    await api.submitForm({
      form_id: form.id,
      data: { ...data, _files: uploadedFiles },
      submitted_by: data.resp || data.nome || data.resp_alt || data.resp_baixa || "Cliente",
    });
    onDone();
  };

  const confirmPicker = () => {
    if (phase === "socio_picker") {
      if (hasAltEvts) setPhase("alt_picker");
      else setPhase("filling");
    } else {
      setPhase("filling");
    }
  };

  // Socio Picker
  if (phase === "socio_picker") {
    return (
      <div className="fill-wrap">
        <div className="fill-card">
          <div className="picker">
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <div className="picker-title">Quantos sócios?</div>
            <div className="picker-desc">Para cada sócio será exibida uma ficha completa de dados pessoais e documentos.</div>
            <div className="picker-counter">
              <button className="picker-btn" disabled={nSocios <= 1} onClick={() => setNSocios((s) => Math.max(1, s - 1))}><Minus size={20} /></button>
              <div className="picker-number">{nSocios}</div>
              <button className="picker-btn" onClick={() => setNSocios((s) => Math.min(10, s + 1))}><Plus size={20} /></button>
            </div>
            <div className="picker-quick">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button key={n} className={cn("picker-quick-btn", nSocios === n && "selected")} onClick={() => setNSocios(n)}>{n}</button>
              ))}
            </div>
            <button className="fill-btn fill-btn--next" style={{ width: "100%" }} onClick={confirmPicker}>Continuar <ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    );
  }

  // Alt Events Picker
  if (phase === "alt_picker") {
    return (
      <div className="fill-wrap">
        <div className="fill-card">
          <div className="picker">
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
            <div className="picker-title">Quais alterações?</div>
            <div className="picker-desc">Marque todas as alterações que se aplicam. Campos específicos aparecerão para cada uma.</div>
            <div className="picker-events">
              {ALTERATION_EVENTS.map((ev) => {
                const on = altEvts.includes(ev.id);
                return (
                  <div key={ev.id} className={cn("picker-event", on && "selected")} onClick={() => setAltEvts((p) => on ? p.filter((x) => x !== ev.id) : [...p, ev.id])}>
                    <div className="picker-event-check">{on && <Check size={14} />}</div>
                    {ev.label}
                  </div>
                );
              })}
            </div>
            {altEvts.length > 0 && <p style={{ fontSize: 13, color: "var(--success)", fontWeight: 700, marginBottom: 14 }}>✓ {altEvts.length} selecionada{altEvts.length > 1 ? "s" : ""}</p>}
            <button className="fill-btn fill-btn--next" style={{ width: "100%" }} onClick={confirmPicker}>Continuar <ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    );
  }

  // No fillable fields
  if (!curField) {
    return (
      <div className="fill-wrap">
        <div className="fill-card" style={{ textAlign: "center", padding: 40 }}>
          <p>Este formulário não tem campos preenchíveis.</p>
          <button className="btn" onClick={onBack} style={{ marginTop: 16 }}>Voltar</button>
        </div>
      </div>
    );
  }

  // Card Fill Mode
  return (
    <div className="fill-wrap">
      <div className="fill-card">
        {/* Progress bar */}
        <div className="fill-progress">
          {fillable.map((_, i) => (
            <div key={i} className={cn("fill-progress-dot", i < step && "done", i === step && "current")} />
          ))}
        </div>

        {/* Group label */}
        {curField._group && <div className="fill-group-label">📎 {curField._group}</div>}

        {/* Question */}
        <div className="fill-label">
          {curField.label}{curField.required && <span style={{ color: "var(--danger)", marginLeft: 4 }}>*</span>}
        </div>
        {curField.description && <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>{curField.description}</div>}
        <div className="fill-sublabel">Pergunta {step + 1} de {total}</div>

        {/* Input by type */}
        {curField.type === "textarea" && (
          <textarea className="input input--lg" value={v} onChange={(e) => setVal(e.target.value)} placeholder={curField.placeholder || "Digite aqui..."} style={{ minHeight: 120 }} />
        )}
        {curField.type === "select" && (
          <select className="input input--lg" value={v} onChange={(e) => setVal(e.target.value)}>
            <option value="">Selecione...</option>
            {(curField.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {curField.type === "radio" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(curField.options || []).map((o) => (
              <div key={o} className={cn("fill-option", v === o && "selected")} onClick={() => setVal(o)}>
                <div className="fill-radio-dot"><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", opacity: v === o ? 1 : 0, transition: ".12s" }} /></div>
                {o}
              </div>
            ))}
          </div>
        )}
        {curField.type === "checkbox" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(curField.options || []).map((o) => {
              const checked = Array.isArray(v) && v.includes(o);
              return (
                <div key={o} className={cn("fill-option", checked && "selected")} onClick={() => {
                  const arr = Array.isArray(v) ? [...v] : [];
                  if (checked) setVal(arr.filter((x: string) => x !== o));
                  else setVal([...arr, o]);
                }}>
                  <div className="fill-checkbox-box">{checked && <Check size={14} />}</div>
                  {o}
                </div>
              );
            })}
          </div>
        )}
        {curField.type === "file" && (
          <>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={handleFileUpload} />
            <div className="fill-upload" onClick={() => fileInputRef.current?.click()}>
              <div className="fill-upload-icon"><Upload size={32} /></div>
              <div className="fill-upload-text">Clique para anexar arquivo</div>
              <div className="fill-upload-hint">PDF, JPG, PNG (máx 10MB)</div>
            </div>
            {uploadedFiles[curField.id] && (
              <div className="fill-upload-preview">
                <Check size={16} style={{ color: "var(--success)" }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{uploadedFiles[curField.id].name}</span>
                <button className="btn btn--icon-sm btn--ghost" onClick={() => { setUploadedFiles((p) => { const n = { ...p }; delete n[curField.id]; return n; }); setVal(""); }}>
                  <X size={14} />
                </button>
              </div>
            )}
          </>
        )}
        {!["textarea", "select", "radio", "checkbox", "file"].includes(curField.type) && (
          <input
            className="input input--lg"
            type={curField.type === "email" ? "email" : curField.type === "date" ? "date" : ["number", "currency"].includes(curField.type) ? "number" : "text"}
            value={v}
            onChange={(e) => { const val = mask ? mask(e.target.value) : e.target.value; setVal(val); }}
            placeholder={curField.placeholder || "Digite aqui..."}
            inputMode={["phone", "cpf", "cnpj", "cep", "number", "currency"].includes(curField.type) ? "numeric" : undefined}
            autoFocus
          />
        )}

        {/* Navigation */}
        <div className="fill-nav">
          {step > 0 && <button className="fill-btn fill-btn--back" onClick={() => setStep((s) => s - 1)}><ArrowLeft size={16} /> Voltar</button>}
          {step === 0 && <button className="fill-btn fill-btn--back" onClick={onBack}><ArrowLeft size={16} /> Sair</button>}
          {step < total - 1 && <button className="fill-btn fill-btn--next" onClick={() => setStep((s) => s + 1)}>Continuar <ChevronRight size={18} /></button>}
          {step === total - 1 && (
            <button className="fill-btn fill-btn--submit" onClick={handleSubmit} disabled={phase === "submitting"}>
              {phase === "submitting" ? "Enviando..." : <><Check size={18} /> Enviar</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
