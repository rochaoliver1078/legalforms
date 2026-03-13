"use client";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft, Plus, Search, Edit3, Trash2, Eye, Clock, Check, X, Filter,
  ChevronRight, FileText, Send, Mail, AlertCircle, CheckCircle2, Loader2,
  GripVertical, Building2, Users, CalendarDays, Flag, ClipboardList, MessageSquare
} from "lucide-react";
import {
  ProcessTemplate, LegalProcess, ProcessEvent, ProcessDocument, ProcessPriority,
  Client, Company, Form,
  PRIORITY_LABELS, PRIORITY_COLORS, DEFAULT_PROCESS_TEMPLATES,
} from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";

interface ProcessesProps {
  onBack: () => void;
  forms: Form[];
}

export default function Processes({ onBack, forms }: ProcessesProps) {
  const [tab, setTab] = useState<"processes" | "templates">("processes");
  const [templates, setTemplates] = useState<ProcessTemplate[]>([]);
  const [processes, setProcesses] = useState<LegalProcess[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [events, setEvents] = useState<ProcessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showNewProcess, setShowNewProcess] = useState(false);
  const [editTemplate, setEditTemplate] = useState<ProcessTemplate | null>(null);
  const [selProcess, setSelProcess] = useState<LegalProcess | null>(null);

  // Template form
  const [tName, setTName] = useState("");
  const [tIcon, setTIcon] = useState("📋");
  const [tColor, setTColor] = useState("#FF6100");
  const [tStages, setTStages] = useState<string[]>(["Coleta de docs", "Análise", "Protocolo", "Concluído"]);
  const [tDocs, setTDocs] = useState<string[]>([]);
  const [tFormIds, setTFormIds] = useState<string[]>([]);
  const [newStage, setNewStage] = useState("");
  const [newDoc, setNewDoc] = useState("");

  // Process form
  const [pTemplateId, setPTemplateId] = useState("");
  const [pClientId, setPClientId] = useState("");
  const [pCompanyId, setPCompanyId] = useState("");
  const [pPriority, setPPriority] = useState<ProcessPriority>("normal");
  const [pDeadline, setPDeadline] = useState("");
  const [pNotes, setPNotes] = useState("");

  // Detail
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/process-templates").then(r => r.json()).catch(() => []),
      fetch("/api/processes").then(r => r.json()).catch(() => []),
      fetch("/api/clients").then(r => r.json()).catch(() => []),
      fetch("/api/companies").then(r => r.json()).catch(() => []),
    ]).then(([t, p, c, co]) => {
      setTemplates(Array.isArray(t) ? t : []);
      setProcesses(Array.isArray(p) ? p : []);
      setClients(Array.isArray(c) ? c : []);
      setCompanies(Array.isArray(co) ? co : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadEvents = async (processId: string) => {
    const r = await fetch(`/api/process-events?process_id=${processId}`);
    const data = await r.json();
    setEvents(Array.isArray(data) ? data : []);
  };

  // Templates CRUD
  const resetTemplateForm = () => {
    setTName(""); setTIcon("📋"); setTColor("#FF6100");
    setTStages(["Coleta de docs", "Análise", "Protocolo", "Concluído"]);
    setTDocs([]); setTFormIds([]); setNewStage(""); setNewDoc("");
  };

  const openEditTemplate = (t: ProcessTemplate) => {
    setEditTemplate(t); setTName(t.name); setTIcon(t.icon); setTColor(t.color);
    setTStages([...t.stages]); setTDocs([...t.documents]); setTFormIds([...t.form_ids]);
    setShowNewTemplate(true);
  };

  const saveTemplate = async () => {
    if (!tName.trim() || tStages.length < 2) return;
    const body = { name: tName, icon: tIcon, color: tColor, stages: tStages, documents: tDocs, form_ids: tFormIds };
    if (editTemplate) {
      const r = await fetch("/api/process-templates", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editTemplate.id, ...body }) });
      const updated = await r.json();
      setTemplates(prev => prev.map(t => t.id === editTemplate.id ? updated : t));
    } else {
      const r = await fetch("/api/process-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const created = await r.json();
      setTemplates(prev => [created, ...prev]);
    }
    setShowNewTemplate(false); setEditTemplate(null); resetTemplateForm();
  };

  const deleteTemplate = async (id: string) => {
    await fetch(`/api/process-templates?id=${id}`, { method: "DELETE" });
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const seedTemplates = async () => {
    for (const tpl of DEFAULT_PROCESS_TEMPLATES) {
      const r = await fetch("/api/process-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tpl) });
      const created = await r.json();
      if (created.id) setTemplates(prev => [...prev, created]);
    }
  };

  // Process CRUD
  const createProcess = async () => {
    const template = templates.find(t => t.id === pTemplateId);
    if (!template || !pClientId) return;
    const client = clients.find(c => c.id === pClientId);
    const title = `${template.name} — ${client?.name || "Cliente"}`;
    const documents: ProcessDocument[] = template.documents.map(d => ({ name: d, received: false }));

    const body = {
      template_id: template.id, title, current_stage: 0,
      stages: template.stages, priority: pPriority,
      client_id: pClientId, company_id: pCompanyId || null,
      deadline: pDeadline || null, notes: pNotes || null, documents,
    };
    const r = await fetch("/api/processes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const created = await r.json();
    if (created.id) setProcesses(prev => [created, ...prev]);
    setShowNewProcess(false); setPTemplateId(""); setPClientId(""); setPCompanyId(""); setPDeadline(""); setPNotes(""); setPPriority("normal");
  };

  const advanceStage = async (proc: LegalProcess, stage: number) => {
    const prevStage = proc.stages[proc.current_stage];
    const nextStage = proc.stages[stage];
    const r = await fetch("/api/processes", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: proc.id, current_stage: stage, _event: { type: "stage_change", description: `Etapa: ${prevStage} → ${nextStage}` } }),
    });
    const updated = await r.json();
    setProcesses(prev => prev.map(p => p.id === proc.id ? updated : p));
    if (selProcess?.id === proc.id) { setSelProcess(updated); loadEvents(proc.id); }
  };

  const toggleDoc = async (proc: LegalProcess, docIndex: number) => {
    const docs = [...proc.documents];
    docs[docIndex] = { ...docs[docIndex], received: !docs[docIndex].received };
    const docName = docs[docIndex].name;
    const status = docs[docIndex].received ? "recebido ✅" : "removido ❌";
    const r = await fetch("/api/processes", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: proc.id, documents: docs, _event: { type: "document", description: `Documento "${docName}" ${status}` } }),
    });
    const updated = await r.json();
    setProcesses(prev => prev.map(p => p.id === proc.id ? updated : p));
    if (selProcess?.id === proc.id) { setSelProcess(updated); loadEvents(proc.id); }
  };

  const addNote = async (proc: LegalProcess) => {
    if (!newNote.trim()) return;
    await fetch("/api/process-events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ process_id: proc.id, type: "note", description: newNote }) });
    setNewNote("");
    loadEvents(proc.id);
  };

  const deleteProcess = async (id: string) => {
    await fetch(`/api/processes?id=${id}`, { method: "DELETE" });
    setProcesses(prev => prev.filter(p => p.id !== id));
    if (selProcess?.id === id) setSelProcess(null);
  };

  const getClient = (id?: string) => clients.find(c => c.id === id);
  const getCompany = (id?: string) => companies.find(c => c.id === id);
  const getTemplate = (id?: string) => templates.find(t => t.id === id);

  const filtered = useMemo(() => {
    if (!search) return processes;
    const s = search.toLowerCase();
    return processes.filter(p => p.title.toLowerCase().includes(s) || getClient(p.client_id)?.name.toLowerCase().includes(s));
  }, [processes, search, clients]);

  const openProcessDetail = async (p: LegalProcess) => {
    setSelProcess(p);
    loadEvents(p.id);
  };

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}><div className="spinner" style={{ margin: "0 auto 16px" }} /><div style={{ color: "var(--text-muted)" }}>Carregando...</div></div>;

  // ========== DETAIL VIEW ==========
  if (selProcess) {
    const proc = processes.find(p => p.id === selProcess.id) || selProcess;
    const client = getClient(proc.client_id);
    const company = getCompany(proc.company_id);
    const tpl = getTemplate(proc.template_id);
    const docsReceived = proc.documents.filter(d => d.received).length;
    const docsTotal = proc.documents.length;
    const isCompleted = proc.current_stage >= proc.stages.length - 1;

    return (
      <div className="dashboard">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button className="btn btn--ghost" onClick={() => setSelProcess(null)}><ArrowLeft size={16} /> Voltar</button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>{proc.title}</h2>
            <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", gap: 12, marginTop: 2 }}>
              {tpl && <span>{tpl.icon} {tpl.name}</span>}
              <span style={{ color: PRIORITY_COLORS[proc.priority] }}>● {PRIORITY_LABELS[proc.priority]}</span>
              {proc.deadline && <span>📅 {new Date(proc.deadline).toLocaleDateString("pt-BR")}</span>}
            </div>
          </div>
          <button className="btn btn--sm btn--ghost" style={{ color: "var(--danger)" }} onClick={() => deleteProcess(proc.id)}><Trash2 size={14} /></button>
        </div>

        {/* Pipeline */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 12 }}>Pipeline</div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {proc.stages.map((stage, i) => {
              const isDone = i < proc.current_stage;
              const isCurrent = i === proc.current_stage;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => advanceStage(proc, i)}>
                  <div style={{
                    height: 6, width: "100%", borderRadius: 3,
                    background: isDone ? (tpl?.color || "var(--primary)") : isCurrent ? (tpl?.color || "var(--primary)") : "var(--border)",
                    opacity: isDone ? 1 : isCurrent ? .6 : .3,
                    transition: "all .2s",
                  }} />
                  <span style={{
                    fontSize: 11, fontWeight: isCurrent ? 800 : 600,
                    color: isCurrent ? (tpl?.color || "var(--primary)") : isDone ? "var(--text-primary)" : "var(--text-muted)",
                  }}>
                    {isDone ? "✅ " : isCurrent ? "▶ " : ""}{stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Left: Info + Docs */}
          <div>
            {/* Client/Company */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>Vinculados</div>
              {client && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><Users size={14} color="var(--text-muted)" /><span style={{ fontWeight: 700 }}>{client.name}</span>{client.phone && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{client.phone}</span>}</div>}
              {company && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Building2 size={14} color="var(--text-muted)" /><span style={{ fontWeight: 700 }}>{company.razao_social}</span></div>}
              {proc.notes && <div style={{ marginTop: 10, fontSize: 13, color: "var(--text-secondary)", padding: 10, background: "var(--bg-page)", borderRadius: "var(--radius-md)" }}>{proc.notes}</div>}
            </div>

            {/* Documents checklist */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px" }}>📎 Documentos ({docsReceived}/{docsTotal})</div>
                {client?.phone && (
                  <button className="reminder-btn" onClick={() => {
                    const pending = proc.documents.filter(d => !d.received).map(d => `❌ ${d.name}`).join("\n");
                    const phone = (client.phone || "").replace(/\D/g, "");
                    const msg = encodeURIComponent(`Olá ${client.name}!\n\nDocumentos pendentes para *${proc.title}*:\n\n${pending}\n\nEnvie o mais breve possível. Obrigado!`);
                    window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
                  }}><Send size={11} /> Cobrar docs</button>
                )}
              </div>
              {proc.documents.map((doc, i) => (
                <div key={i} onClick={() => toggleDoc(proc, i)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                  borderRadius: "var(--radius-sm)", cursor: "pointer", transition: "background .1s",
                  background: doc.received ? "var(--success-bg)" : "transparent",
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${doc.received ? "var(--success)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", background: doc.received ? "var(--success)" : "transparent" }}>
                    {doc.received && <Check size={12} color="#fff" />}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, textDecoration: doc.received ? "line-through" : "none", color: doc.received ? "var(--text-muted)" : "var(--text-primary)" }}>{doc.name}</span>
                </div>
              ))}
              {proc.documents.length === 0 && <div style={{ fontSize: 13, color: "var(--text-muted)", padding: 12 }}>Nenhum documento definido</div>}
            </div>
          </div>

          {/* Right: Timeline */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>🕐 Timeline</div>
            {/* Add note */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input className="input" placeholder="Adicionar nota..." value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote(proc)} />
              <button className="btn btn--primary btn--sm" onClick={() => addNote(proc)} disabled={!newNote.trim()}><Plus size={14} /></button>
            </div>
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              {events.map(ev => {
                const iconMap: Record<string, string> = { created: "🆕", stage_change: "📦", note: "💬", document: "📎", notification: "📩" };
                return (
                  <div key={ev.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
                    <span style={{ fontSize: 16 }}>{iconMap[ev.type] || "📋"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.description}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDate(ev.created_at)}</div>
                    </div>
                  </div>
                );
              })}
              {events.length === 0 && <div style={{ fontSize: 13, color: "var(--text-muted)", padding: 12, textAlign: "center" }}>Nenhum evento</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== LIST VIEW ==========
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn--ghost" onClick={onBack}><ArrowLeft size={16} /></button>
          <h2 className="dashboard-title">⚖️ Processos</h2>
        </div>
        <div className="dashboard-actions">
          <div style={{ display: "flex", gap: 2, background: "var(--bg-page)", borderRadius: "var(--radius-md)", padding: 3 }}>
            <button
              onClick={() => setTab("processes")}
              style={{ padding: "6px 14px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all .15s",
                background: tab === "processes" ? "var(--bg-card)" : "transparent",
                color: tab === "processes" ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: tab === "processes" ? "var(--shadow-sm)" : "none"
              }}
            ><ClipboardList size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />Processos</button>
            <button
              onClick={() => setTab("templates")}
              style={{ padding: "6px 14px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all .15s",
                background: tab === "templates" ? "var(--bg-card)" : "transparent",
                color: tab === "templates" ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: tab === "templates" ? "var(--shadow-sm)" : "none"
              }}
            ><FileText size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />Modelos</button>
          </div>
          <div className="search-box"><Search size={16} /><input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          {tab === "processes" && <button className="btn btn--primary" onClick={() => setShowNewProcess(true)}><Plus size={16} /> Novo Processo</button>}
          {tab === "templates" && <button className="btn btn--primary" onClick={() => { resetTemplateForm(); setEditTemplate(null); setShowNewTemplate(true); }}><Plus size={16} /> Novo Modelo</button>}
        </div>
      </div>

      {/* PROCESSES TAB */}
      {tab === "processes" && (
        <>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: .5 }}>⚖️</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Nenhum processo</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Crie um novo processo para começar</div>
              {templates.length === 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: "var(--warning)", marginBottom: 8 }}>⚠️ Primeiro crie modelos de processo</div>
                  <button className="btn btn--primary" onClick={() => { setTab("templates"); }}><FileText size={14} /> Ir para Modelos</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(p => {
                const client = getClient(p.client_id);
                const company = getCompany(p.company_id);
                const tpl = getTemplate(p.template_id);
                const progress = p.stages.length > 0 ? Math.round(((p.current_stage) / (p.stages.length - 1)) * 100) : 0;
                const docsOk = p.documents.filter(d => d.received).length;
                return (
                  <div key={p.id} className="card card--clickable" style={{ padding: 16, display: "flex", alignItems: "center", gap: 16, animation: "staggerIn .4s var(--ease-bounce) both" }} onClick={() => openProcessDetail(p)}>
                    <div style={{ fontSize: 28 }}>{tpl?.icon || "📋"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{p.title}</div>
                      <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)" }}>
                        {client && <span>👤 {client.name}</span>}
                        {company && <span>🏢 {company.razao_social?.slice(0, 20)}</span>}
                        {p.deadline && <span>📅 {new Date(p.deadline).toLocaleDateString("pt-BR")}</span>}
                      </div>
                      {/* Mini pipeline */}
                      <div style={{ display: "flex", gap: 2, marginTop: 8, height: 4 }}>
                        {p.stages.map((_, i) => (
                          <div key={i} style={{ flex: 1, borderRadius: 2, background: i <= p.current_stage ? (tpl?.color || "var(--primary)") : "var(--border)", opacity: i <= p.current_stage ? 1 : .3 }} />
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: PRIORITY_COLORS[p.priority] + "18", color: PRIORITY_COLORS[p.priority] }}>{PRIORITY_LABELS[p.priority]}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.stages[p.current_stage]}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>📎 {docsOk}/{p.documents.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TEMPLATES TAB */}
      {tab === "templates" && (
        <>
          {templates.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: .5 }}>📋</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Nenhum modelo</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Crie um modelo ou carregue os padrões</div>
              <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={seedTemplates}><Plus size={14} /> Carregar modelos padrão</button>
            </div>
          ) : (
            <div className="forms-grid">
              {templates.map(t => (
                <div key={t.id} className="form-card" onClick={() => openEditTemplate(t)}>
                  <div className="form-card-icon" style={{ background: t.color + "18", color: t.color, fontSize: 28 }}>{t.icon}</div>
                  <div className="form-card-name">{t.name}</div>
                  <div className="form-card-meta">{t.stages.length} etapas · {t.documents.length} docs</div>
                  <div className="form-card-stats">
                    {t.stages.map((s, i) => <span key={i} style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", padding: "2px 6px", background: "var(--bg-page)", borderRadius: "var(--radius-sm)" }}>{s}</span>)}
                  </div>
                  <div className="form-card-actions">
                    <button className="btn btn--icon-sm btn--ghost" onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL: NEW/EDIT TEMPLATE */}
      {showNewTemplate && (
        <div className="modal-backdrop" onClick={() => { setShowNewTemplate(false); setEditTemplate(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{editTemplate ? "Editar Modelo" : "Novo Modelo"}</h3>
              <button className="btn btn--icon btn--ghost" onClick={() => { setShowNewTemplate(false); setEditTemplate(null); }}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto" }}>
              <div className="form-group">
                <label className="form-label">Nome do modelo</label>
                <input className="input" value={tName} onChange={e => setTName(e.target.value)} placeholder="Ex: Abertura MEI" />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Ícone</label>
                  <input className="input" value={tIcon} onChange={e => setTIcon(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Cor</label>
                  <input type="color" className="input" value={tColor} onChange={e => setTColor(e.target.value)} style={{ height: 42, padding: 4 }} />
                </div>
              </div>

              {/* Stages */}
              <div className="form-group">
                <label className="form-label">Etapas do pipeline</label>
                {tStages.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", width: 20 }}>{i + 1}</span>
                    <input className="input" value={s} onChange={e => { const arr = [...tStages]; arr[i] = e.target.value; setTStages(arr); }} style={{ flex: 1 }} />
                    <button className="btn btn--icon-sm btn--ghost" onClick={() => setTStages(tStages.filter((_, j) => j !== i))}><X size={12} /></button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <input className="input" placeholder="Nova etapa..." value={newStage} onChange={e => setNewStage(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newStage.trim()) { setTStages([...tStages, newStage.trim()]); setNewStage(""); } }} />
                  <button className="btn btn--sm" onClick={() => { if (newStage.trim()) { setTStages([...tStages, newStage.trim()]); setNewStage(""); } }}><Plus size={14} /></button>
                </div>
              </div>

              {/* Documents */}
              <div className="form-group">
                <label className="form-label">Documentos necessários</label>
                {tDocs.map((d, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13 }}>📎</span>
                    <input className="input" value={d} onChange={e => { const arr = [...tDocs]; arr[i] = e.target.value; setTDocs(arr); }} style={{ flex: 1 }} />
                    <button className="btn btn--icon-sm btn--ghost" onClick={() => setTDocs(tDocs.filter((_, j) => j !== i))}><X size={12} /></button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <input className="input" placeholder="Novo documento..." value={newDoc} onChange={e => setNewDoc(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newDoc.trim()) { setTDocs([...tDocs, newDoc.trim()]); setNewDoc(""); } }} />
                  <button className="btn btn--sm" onClick={() => { if (newDoc.trim()) { setTDocs([...tDocs, newDoc.trim()]); setNewDoc(""); } }}><Plus size={14} /></button>
                </div>
              </div>

              {/* Linked forms */}
              <div className="form-group">
                <label className="form-label">Formulários vinculados</label>
                {forms.map(f => (
                  <label key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13, cursor: "pointer" }}>
                    <input type="checkbox" checked={tFormIds.includes(f.id)} onChange={() => setTFormIds(prev => prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id])} />
                    <span style={{ fontWeight: 600 }}>{f.icon || "📋"} {f.name}</span>
                  </label>
                ))}
                {forms.length === 0 && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Nenhum formulário criado</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => { setShowNewTemplate(false); setEditTemplate(null); }}>Cancelar</button>
              <button className="btn btn--primary" onClick={saveTemplate} disabled={!tName.trim() || tStages.length < 2}>{editTemplate ? "Salvar" : "Criar Modelo"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW PROCESS */}
      {showNewProcess && (
        <div className="modal-backdrop" onClick={() => setShowNewProcess(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Novo Processo</h3>
              <button className="btn btn--icon btn--ghost" onClick={() => setShowNewProcess(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Modelo de processo *</label>
                <select className="input" value={pTemplateId} onChange={e => setPTemplateId(e.target.value)}>
                  <option value="">Selecionar modelo...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name} ({t.stages.length} etapas)</option>)}
                </select>
                {templates.length === 0 && <div style={{ fontSize: 12, color: "var(--warning)", marginTop: 4 }}>⚠️ Crie um modelo primeiro na aba Modelos</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Cliente *</label>
                <select className="input" value={pClientId} onChange={e => setPClientId(e.target.value)}>
                  <option value="">Selecionar cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.cpf ? `(${c.cpf})` : ""}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Empresa (opcional)</label>
                <select className="input" value={pCompanyId} onChange={e => setPCompanyId(e.target.value)}>
                  <option value="">Nenhuma</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Prioridade</label>
                  <select className="input" value={pPriority} onChange={e => setPPriority(e.target.value as ProcessPriority)}>
                    <option value="baixa">🟢 Baixa</option>
                    <option value="normal">🔵 Normal</option>
                    <option value="urgente">🔴 Urgente</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Prazo</label>
                  <input type="date" className="input" value={pDeadline} onChange={e => setPDeadline(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea className="input" value={pNotes} onChange={e => setPNotes(e.target.value)} placeholder="Notas internas..." rows={2} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowNewProcess(false)}>Cancelar</button>
              <button className="btn btn--primary" onClick={createProcess} disabled={!pTemplateId || !pClientId}>Criar Processo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
