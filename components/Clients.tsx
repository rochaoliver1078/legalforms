"use client";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft, Plus, Search, Edit3, Trash2, Users, Building2, Phone, Mail,
  ChevronRight, FileText, Eye, Clock, Check, X, Filter
} from "lucide-react";
import { Client, Form, Submission, ProcessStatus, PROCESS_STATUS_LABELS, PROCESS_STATUS_COLORS } from "@/lib/types";
import { maskCNPJ, maskCPF, maskPhone, formatDate, cn } from "@/lib/utils";

interface ClientsProps {
  onBack: () => void;
  forms: Form[];
  onViewForm: (id: string) => void;
}

export default function Clients({ onBack, forms, onViewForm }: ClientsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selClient, setSelClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({ name: "", email: "", cnpj: "", phone: "", process_status: "pending" });
  const [editId, setEditId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | "all">("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/submissions").then((r) => r.json()),
    ]).then(([c, s]) => {
      setClients(Array.isArray(c) ? c : []);
      setSubs(Array.isArray(s) ? s : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Match submissions to clients by CNPJ or name
  const getClientSubs = (client: Client): Submission[] => {
    return subs.filter((s) => {
      const d = s.data || {};
      if (client.cnpj) {
        const cnpjClean = client.cnpj.replace(/\D/g, "");
        const match = Object.values(d).some((v) => typeof v === "string" && v.replace(/\D/g, "") === cnpjClean);
        if (match) return true;
      }
      if (client.name) {
        const match = Object.values(d).some((v) => typeof v === "string" && v.toLowerCase().includes(client.name.toLowerCase()));
        if (match) return true;
      }
      if (s.submitted_by && client.name && s.submitted_by.toLowerCase().includes(client.name.toLowerCase())) return true;
      return false;
    });
  };

  // Get which forms a client responded to
  const getClientForms = (client: Client) => {
    const clientSubs = getClientSubs(client);
    const formIds = Array.from(new Set(clientSubs.map((s) => s.form_id)));
    return formIds.map((fid) => {
      const form = forms.find((f) => f.id === fid);
      const count = clientSubs.filter((s) => s.form_id === fid).length;
      return { form, count, latestSub: clientSubs.filter((s) => s.form_id === fid).sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0] };
    }).filter((x) => x.form);
  };

  // Pending forms (forms client hasn't responded to)
  const getPendingForms = (client: Client) => {
    const respondedIds = new Set(getClientSubs(client).map((s) => s.form_id));
    return forms.filter((f) => !respondedIds.has(f.id) && f.status !== "archived");
  };

  const filtered = useMemo(() => {
    let list = clients;
    if (statusFilter !== "all") list = list.filter((c) => c.process_status === statusFilter);
    if (search) list = list.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.cnpj || "").includes(search) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [clients, search, statusFilter]);

  const handleSave = async () => {
    if (!formData.name?.trim()) return;
    if (editId) {
      const r = await fetch("/api/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...formData }) });
      if (r.ok) {
        const updated = await r.json();
        setClients((p) => p.map((c) => (c.id === editId ? updated : c)));
        if (selClient?.id === editId) setSelClient(updated);
      }
    } else {
      const r = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (r.ok) {
        const created = await r.json();
        setClients((p) => [created, ...p]);
      }
    }
    setShowForm(false);
    setEditId(null);
    setFormData({ name: "", email: "", cnpj: "", phone: "", process_status: "pending" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este cliente?")) return;
    await fetch(`/api/clients?id=${id}`, { method: "DELETE" });
    setClients((p) => p.filter((c) => c.id !== id));
    if (selClient?.id === id) setSelClient(null);
  };

  const handleEdit = (client: Client) => {
    setFormData({ name: client.name, email: client.email, cnpj: client.cnpj, cpf: client.cpf, phone: client.phone, contact_name: client.contact_name, notes: client.notes, process_status: client.process_status });
    setEditId(client.id);
    setShowForm(true);
  };

  const updateStatus = async (client: Client, status: ProcessStatus) => {
    const r = await fetch("/api/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: client.id, process_status: status }) });
    if (r.ok) {
      const updated = await r.json();
      setClients((p) => p.map((c) => (c.id === client.id ? updated : c)));
      if (selClient?.id === client.id) setSelClient(updated);
    }
  };

  const statusOptions: ProcessStatus[] = ["pending", "docs_received", "analyzing", "filed", "completed"];

  // Loading
  if (loading) return (
    <div className="clients-page">
      <div className="clients-header"><div className="skeleton" style={{ width: 200, height: 28 }} /></div>
      <div className="clients-grid">{[1, 2, 3, 4].map((i) => <div key={i} className="client-card skeleton-card"><div className="skeleton" style={{ width: "70%", height: 16 }} /><div className="skeleton" style={{ width: "50%", height: 12, marginTop: 8 }} /></div>)}</div>
    </div>
  );

  // Client Detail
  if (selClient) {
    const clientForms = getClientForms(selClient);
    const pending = getPendingForms(selClient);
    return (
      <div className="clients-page">
        <div className="clients-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn--ghost" onClick={() => setSelClient(null)}><ArrowLeft size={16} /> Voltar</button>
            <div><h2 style={{ fontSize: 22, fontWeight: 800 }}>{selClient.name}</h2>{selClient.cnpj && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>CNPJ: {selClient.cnpj}</div>}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--sm" onClick={() => handleEdit(selClient)}><Edit3 size={14} /> Editar</button>
            <button className="btn btn--sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(selClient.id)}><Trash2 size={14} /></button>
          </div>
        </div>

        {/* Status */}
        <div className="client-status-bar">
          {statusOptions.map((s) => (
            <button key={s} className={cn("client-status-step", selClient.process_status === s && "active")}
              style={{ borderColor: selClient.process_status === s ? PROCESS_STATUS_COLORS[s] : undefined, background: selClient.process_status === s ? PROCESS_STATUS_COLORS[s] + "18" : undefined }}
              onClick={() => updateStatus(selClient, s)}>
              <div className="client-status-dot" style={{ background: PROCESS_STATUS_COLORS[s] }} />
              {PROCESS_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Client Info */}
        <div className="client-info-grid">
          {selClient.email && <div className="client-info-item"><Mail size={14} /> {selClient.email}</div>}
          {selClient.phone && <div className="client-info-item"><Phone size={14} /> {selClient.phone}</div>}
          {selClient.contact_name && <div className="client-info-item"><Users size={14} /> {selClient.contact_name}</div>}
          {selClient.notes && <div className="client-info-item" style={{ gridColumn: "1/-1" }}><FileText size={14} /> {selClient.notes}</div>}
        </div>

        {/* Responded Forms */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>📋 Formulários respondidos ({clientForms.length})</h3>
          {clientForms.length === 0 ? <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Nenhuma resposta vinculada a este cliente.</div> : (
            <div className="client-forms-list">
              {clientForms.map(({ form, count, latestSub }) => (
                <div key={form!.id} className="client-form-item" onClick={() => onViewForm(form!.id)}>
                  <div className="client-form-icon" style={{ background: form!.color + "18", color: form!.color }}>{form!.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{form!.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{count} resposta(s) · Última em {formatDate(latestSub.submitted_at)}</div>
                  </div>
                  <div className="client-form-badge"><Check size={14} /> Respondido</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Forms */}
        {pending.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>⏳ Formulários pendentes ({pending.length})</h3>
            <div className="client-forms-list">
              {pending.map((f) => (
                <div key={f.id} className="client-form-item client-form-item--pending" onClick={() => onViewForm(f.id)}>
                  <div className="client-form-icon" style={{ background: "#fef2f2", color: "#dc2626" }}>{f.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Não preenchido</div>
                  </div>
                  <div className="client-form-badge client-form-badge--pending"><Clock size={14} /> Pendente</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>🕐 Timeline</h3>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-dot" style={{ background: PROCESS_STATUS_COLORS[selClient.process_status] }} />
              <div className="timeline-content">
                <div style={{ fontWeight: 700 }}>Status: {PROCESS_STATUS_LABELS[selClient.process_status]}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(selClient.updated_at)}</div>
              </div>
            </div>
            {getClientSubs(selClient).sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()).slice(0, 10).map((s) => {
              const form = forms.find((f) => f.id === s.form_id);
              return (
                <div key={s.id} className="timeline-item">
                  <div className="timeline-dot" style={{ background: "#3b82f6" }} />
                  <div className="timeline-content">
                    <div style={{ fontWeight: 700 }}>Respondeu: {form?.name || "Formulário"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>por {s.submitted_by || "Anônimo"} · {formatDate(s.submitted_at)}</div>
                  </div>
                </div>
              );
            })}
            <div className="timeline-item">
              <div className="timeline-dot" style={{ background: "#10b981" }} />
              <div className="timeline-content">
                <div style={{ fontWeight: 700 }}>Cliente cadastrado</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(selClient.created_at)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="clients-page">
      {/* Header */}
      <div className="clients-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn--ghost" onClick={onBack}><ArrowLeft size={16} /></button>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}><Building2 size={22} style={{ display: "inline", marginRight: 6 }} /> Clientes</h2>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>({clients.length})</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="search-box" style={{ width: 240 }}><Search size={16} /><input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <button className="btn btn--primary" onClick={() => { setShowForm(true); setEditId(null); setFormData({ name: "", email: "", cnpj: "", phone: "", process_status: "pending" }); }}><Plus size={16} /> Novo Cliente</button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="filter-bar">
        <div className="filter-pills">
          <button className={cn("filter-pill", statusFilter === "all" && "active")} onClick={() => setStatusFilter("all")}>Todos</button>
          {statusOptions.map((s) => (
            <button key={s} className={cn("filter-pill", statusFilter === s && "active")} onClick={() => setStatusFilter(statusFilter === s ? "all" : s)} style={{ borderColor: statusFilter === s ? PROCESS_STATUS_COLORS[s] : undefined }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: PROCESS_STATUS_COLORS[s], display: "inline-block" }} /> {PROCESS_STATUS_LABELS[s]} ({clients.filter((c) => c.process_status === s).length})
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="clients-grid">
        {filtered.map((c) => {
          const numSubs = getClientSubs(c).length;
          const cSubs = getClientSubs(c);
          const numForms = Array.from(new Set(cSubs.map((s) => s.form_id))).length;
          return (
            <div key={c.id} className="client-card" onClick={() => setSelClient(c)}>
              <div className="client-card-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn btn--icon-sm btn--ghost" onClick={() => handleEdit(c)}><Edit3 size={14} /></button>
                <button className="btn btn--icon-sm btn--ghost" style={{ color: "var(--danger)" }} onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
              </div>
              <div className="client-card-avatar" style={{ background: PROCESS_STATUS_COLORS[c.process_status] + "20", color: PROCESS_STATUS_COLORS[c.process_status] }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="client-card-name">{c.name}</div>
              {c.cnpj && <div className="client-card-meta">{c.cnpj}</div>}
              {c.email && <div className="client-card-meta"><Mail size={11} /> {c.email}</div>}
              <div className="client-card-bottom">
                <span className="client-status-badge" style={{ background: PROCESS_STATUS_COLORS[c.process_status] + "18", color: PROCESS_STATUS_COLORS[c.process_status], borderColor: PROCESS_STATUS_COLORS[c.process_status] }}>
                  {PROCESS_STATUS_LABELS[c.process_status]}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{numSubs} resp. · {numForms} forms</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: .5 }}>🏢</div>
            <div style={{ fontWeight: 700 }}>Nenhum cliente encontrado</div>
            <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>Cadastrar primeiro cliente</button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>{editId ? "Editar Cliente" : "Novo Cliente"}</h3>
              <button className="btn btn--icon btn--ghost" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Nome / Razão Social *</label><input className="input" value={formData.name || ""} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group"><label className="form-label">CNPJ</label><input className="input" value={formData.cnpj || ""} onChange={(e) => setFormData((p) => ({ ...p, cnpj: maskCNPJ(e.target.value) }))} placeholder="00.000.000/0000-00" /></div>
                <div className="form-group"><label className="form-label">CPF</label><input className="input" value={formData.cpf || ""} onChange={(e) => setFormData((p) => ({ ...p, cpf: maskCPF(e.target.value) }))} placeholder="000.000.000-00" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group"><label className="form-label">E-mail</label><input className="input" value={formData.email || ""} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Telefone</label><input className="input" value={formData.phone || ""} onChange={(e) => setFormData((p) => ({ ...p, phone: maskPhone(e.target.value) }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Contato</label><input className="input" value={formData.contact_name || ""} onChange={(e) => setFormData((p) => ({ ...p, contact_name: e.target.value }))} placeholder="Nome do responsável" /></div>
              <div className="form-group"><label className="form-label">Observações</label><textarea className="input" value={formData.notes || ""} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} rows={3} /></div>
              <div className="form-group"><label className="form-label">Status</label>
                <select className="input" value={formData.process_status} onChange={(e) => setFormData((p) => ({ ...p, process_status: e.target.value as ProcessStatus }))}>
                  {statusOptions.map((s) => <option key={s} value={s}>{PROCESS_STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleSave}>{editId ? "Salvar" : "Cadastrar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
