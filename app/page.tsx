"use client";
import { useState, useEffect, useCallback } from "react";
import { Form, Client } from "@/lib/types";
import { FORM_TEMPLATES } from "@/lib/field-definitions";
import { uid } from "@/lib/utils";
import Topbar from "@/components/Topbar";
import Dashboard from "@/components/Dashboard";
import Builder from "@/components/Builder";
import FillMode from "@/components/FillMode";
import ShareModal from "@/components/ShareModal";
import Responses from "@/components/Responses";
import Clients from "@/components/Clients";
import Kanban from "@/components/Kanban";

const api = {
  async getForms(): Promise<Form[]> { const r = await fetch("/api/forms"); return r.ok ? r.json() : []; },
  async createForm(d: Partial<Form>): Promise<Form | null> { const r = await fetch("/api/forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }); return r.ok ? r.json() : null; },
  async updateForm(d: Partial<Form> & { id: string }): Promise<Form | null> { const r = await fetch("/api/forms", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }); return r.ok ? r.json() : null; },
  async deleteForm(id: string): Promise<void> { await fetch(`/api/forms?id=${id}`, { method: "DELETE" }); },
  async getNewSubmissionsCount(): Promise<number> {
    try {
      const r = await fetch("/api/submissions");
      if (!r.ok) return 0;
      const subs = await r.json();
      if (!Array.isArray(subs)) return 0;
      // Count subs from last 24h
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return subs.filter((s: any) => new Date(s.submitted_at).getTime() > cutoff).length;
    } catch { return 0; }
  }
};

type Page = "dashboard" | "builder" | "fill" | "done" | "responses" | "clients" | "kanban";

export default function LegalFormsPage() {
  const [page, setPage] = useState<Page>("dashboard");
  const [forms, setForms] = useState<Form[]>([]);
  const [curId, setCurId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [toast, setToast] = useState("");
  const [newSubsCount, setNewSubsCount] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [companyCount, setCompanyCount] = useState(0);

  const curForm = forms.find((f) => f.id === curId) || null;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000); };
  const goTo = (pg: Page, id?: string) => { setPage(pg); if (id) setCurId(id); };

  useEffect(() => {
    Promise.all([
      api.getForms(),
      api.getNewSubmissionsCount(),
      fetch("/api/clients").then(r => r.json()).catch(() => []),
      fetch("/api/companies").then(r => r.json()).catch(() => []),
    ])
      .then(([f, count, cl, co]) => {
        setForms(Array.isArray(f) ? f : []);
        setNewSubsCount(count);
        setClients(Array.isArray(cl) ? cl : []);
        setCompanyCount(Array.isArray(co) ? co.length : 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); showToast("Salvo automaticamente!"); }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") { e.preventDefault(); if (curId && page === "builder") goTo("fill", curId); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const handleCreateForm = async (templateId?: string) => {
    let data: Partial<Form> = { name: "Novo Formulário", status: "active", tags: [], version: 1 };
    if (templateId) {
      const tpl = FORM_TEMPLATES.find((t) => t.id === templateId);
      if (tpl) {
        const fields = tpl.fields.map((f) => ({ ...f, id: uid() }));
        data = { ...data, name: tpl.name, icon: tpl.icon, color: tpl.color, fields };
      }
    }
    const result = await api.createForm(data);
    if (result) { setForms((p) => [{ ...result, response_count: 0 }, ...p]); setCurId(result.id); setPage("builder"); showToast("Formulário criado!"); }
  };

  const handleUpdateForm = (updates: Partial<Form>) => {
    if (!curId) return;
    setForms((p) => p.map((f) => (f.id === curId ? { ...f, ...updates } : f)));
    setSaving(true);
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const form = forms.find((f) => f.id === curId);
      if (form) { const { id: _id, ...rest } = form; await api.updateForm({ id: curId, ...rest, ...updates }); }
      setSaving(false);
    }, 800);
  };

  const handleUpdateFormById = (id: string, updates: Partial<Form>) => {
    setForms((p) => p.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    setTimeout(async () => {
      const form = forms.find((f) => f.id === id);
      if (form) { const { id: _id, ...rest } = form; await api.updateForm({ id, ...rest, ...updates }); }
    }, 300);
  };

  const handleDeleteForm = async (id: string) => {
    if (!confirm("Excluir este formulário?")) return;
    await api.deleteForm(id);
    setForms((p) => p.filter((f) => f.id !== id));
    showToast("Formulário excluído");
  };

  const handleDuplicateForm = async (id: string) => {
    const orig = forms.find((f) => f.id === id);
    if (!orig) return;
    const fields = orig.fields.map((f) => ({ ...f, id: uid() }));
    const result = await api.createForm({ name: orig.name + " (cópia)", icon: orig.icon, color: orig.color, fields, tags: orig.tags, theme: orig.theme, settings: orig.settings, status: "active", version: 1 });
    if (result) { setForms((p) => [{ ...result, response_count: 0 }, ...p]); showToast("Formulário duplicado!"); }
  };

  const handleArchiveForm = (id: string) => {
    const form = forms.find((f) => f.id === id);
    const newStatus = form?.status === "archived" ? "active" : "archived";
    handleUpdateFormById(id, { status: newStatus as any });
    showToast(newStatus === "archived" ? "Formulário arquivado" : "Formulário restaurado");
  };

  // Loading
  if (loading) return (
    <>
      <Topbar page="dashboard" onBack={() => {}} />
      <Dashboard forms={[]} search="" onSearchChange={() => {}} onCreateForm={() => {}} onEditForm={() => {}} onFillForm={() => {}} onShareForm={() => {}} onDeleteForm={() => {}} onViewResponses={() => {}} onDuplicateForm={() => {}} onArchiveForm={() => {}} onUpdateForm={() => {}} loading={true} />
    </>
  );

  return (
    <>
      <Topbar page={page} formName={page === "builder" ? curForm?.name : undefined} saving={saving}
        onBack={() => goTo("dashboard")} onPreview={() => curId && goTo("fill", curId)} onShare={() => setShowShare(true)}
        onCreate={() => handleCreateForm()} onNameChange={(name) => handleUpdateForm({ name })}
        onClients={() => goTo("clients")} onKanban={() => goTo("kanban")} newSubsCount={newSubsCount} />

      {page === "dashboard" && (
        <Dashboard forms={forms} search={search} onSearchChange={setSearch} onCreateForm={handleCreateForm} onEditForm={(id) => goTo("builder", id)}
          onFillForm={(id) => goTo("fill", id)} onShareForm={(id) => { setCurId(id); setShowShare(true); }} onDeleteForm={handleDeleteForm}
          onViewResponses={(id) => goTo("responses", id)} onDuplicateForm={handleDuplicateForm} onArchiveForm={handleArchiveForm} onUpdateForm={handleUpdateFormById}
          clientCount={clients.length} companyCount={companyCount} newSubsCount={newSubsCount}
          onGoClients={() => goTo("clients")} onGoKanban={() => goTo("kanban")} />
      )}

      {page === "builder" && curForm && <Builder form={curForm} onUpdateForm={handleUpdateForm} />}
      {page === "fill" && curForm && <FillMode form={curForm} onDone={() => { goTo("done"); showToast("Enviado!"); }} onBack={() => goTo("dashboard")} />}

      {page === "done" && (
        <div className="done-wrap">
          <div className="done-card">
            <div className="done-icon">✅</div>
            <div className="done-title">Formulário enviado!</div>
            <div className="done-desc">Dados coletados com sucesso.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn--primary" onClick={() => goTo("dashboard")}>Meus Formulários</button>
              {curId && <button className="btn" onClick={() => goTo("fill", curId)}>Preencher outro</button>}
            </div>
          </div>
        </div>
      )}

      {page === "responses" && curForm && <Responses form={curForm} onBack={() => goTo("dashboard")} />}
      {page === "clients" && <Clients onBack={() => goTo("dashboard")} forms={forms} onViewForm={(id) => goTo("responses", id)} />}
      {page === "kanban" && <Kanban onBack={() => goTo("dashboard")} onSelectClient={() => goTo("clients")} forms={forms} onCreateClient={() => goTo("clients")} />}
      {showShare && curForm && <ShareModal form={curForm} onClose={() => setShowShare(false)} onUpdateEmails={(emails) => handleUpdateForm({ emails })} clients={clients} />}
      {toast && <div className="toast-container"><div className="toast">{toast}</div></div>}
    </>
  );
}
