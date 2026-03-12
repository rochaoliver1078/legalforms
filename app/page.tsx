"use client";
import { useState, useEffect } from "react";
import { Form } from "@/lib/types";
import { FORM_TEMPLATES } from "@/lib/field-definitions";
import { uid } from "@/lib/utils";
import Topbar from "@/components/Topbar";
import Dashboard from "@/components/Dashboard";
import Builder from "@/components/Builder";
import FillMode from "@/components/FillMode";
import ShareModal from "@/components/ShareModal";
import Responses from "@/components/Responses";

// API helpers
const api = {
  async getForms(): Promise<Form[]> { const r = await fetch("/api/forms"); return r.ok ? r.json() : []; },
  async createForm(d: Partial<Form>): Promise<Form | null> { const r = await fetch("/api/forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }); return r.ok ? r.json() : null; },
  async updateForm(d: Partial<Form> & { id: string }): Promise<Form | null> { const r = await fetch("/api/forms", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }); return r.ok ? r.json() : null; },
  async deleteForm(id: string): Promise<void> { await fetch(`/api/forms?id=${id}`, { method: "DELETE" }); },
};

type Page = "dashboard" | "builder" | "fill" | "done" | "responses";

export default function LegalFormsPage() {
  const [page, setPage] = useState<Page>("dashboard");
  const [forms, setForms] = useState<Form[]>([]);
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [toast, setToast] = useState("");

  const currentForm = forms.find((f) => f.id === currentFormId) || null;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Load forms
  useEffect(() => {
    api.getForms().then((data) => { setForms(Array.isArray(data) ? data : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const goTo = (pg: Page, formId?: string) => {
    setPage(pg);
    if (formId) setCurrentFormId(formId);
  };

  // --- Form CRUD ---
  const handleCreateForm = async (templateId?: string) => {
    let formData: Partial<Form> = { name: "Novo Formulário" };
    if (templateId) {
      const tpl = FORM_TEMPLATES.find((t) => t.id === templateId);
      if (tpl) {
        // Re-generate IDs for template fields
        const fields = tpl.fields.map((f) => ({ ...f, id: uid() }));
        formData = { name: tpl.name, icon: tpl.icon, color: tpl.color, fields };
      }
    }
    const result = await api.createForm(formData);
    if (result) {
      setForms((p) => [{ ...result, response_count: 0 }, ...p]);
      setCurrentFormId(result.id);
      setPage("builder");
      showToast("Formulário criado!");
    }
  };

  const handleUpdateForm = (updates: Partial<Form>) => {
    if (!currentFormId) return;
    setForms((p) => p.map((f) => (f.id === currentFormId ? { ...f, ...updates } : f)));
    // Debounced API save
    setSaving(true);
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const form = forms.find((f) => f.id === currentFormId);
      if (form) {
        const { id: _id, ...rest } = form;
        await api.updateForm({ id: currentFormId, ...rest, ...updates });
      }
      setSaving(false);
    }, 800);
  };

  const handleDeleteForm = async (id: string) => {
    if (!confirm("Excluir este formulário?")) return;
    await api.deleteForm(id);
    setForms((p) => p.filter((f) => f.id !== id));
    showToast("Formulário excluído");
  };

  // --- Loading state ---
  if (loading) {
    return (
      <>
        <Topbar page="dashboard" onBack={() => {}} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 56px)" }}>
          <div style={{ textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }} />
            <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Carregando formulários...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Topbar */}
      <Topbar
        page={page}
        formName={page === "builder" ? currentForm?.name : undefined}
        saving={saving}
        onBack={() => goTo("dashboard")}
        onPreview={() => currentFormId && goTo("fill", currentFormId)}
        onShare={() => setShowShare(true)}
        onCreate={() => handleCreateForm()}
        onNameChange={(name) => handleUpdateForm({ name })}
      />

      {/* Pages */}
      {page === "dashboard" && (
        <Dashboard
          forms={forms}
          search={search}
          onSearchChange={setSearch}
          onCreateForm={handleCreateForm}
          onEditForm={(id) => goTo("builder", id)}
          onFillForm={(id) => goTo("fill", id)}
          onShareForm={(id) => { setCurrentFormId(id); setShowShare(true); }}
          onDeleteForm={handleDeleteForm}
          onViewResponses={(id) => goTo("responses", id)}
        />
      )}

      {page === "builder" && currentForm && (
        <Builder form={currentForm} onUpdateForm={handleUpdateForm} />
      )}

      {page === "fill" && currentForm && (
        <FillMode
          form={currentForm}
          onDone={() => { goTo("done"); showToast("Formulário enviado com sucesso!"); }}
          onBack={() => goTo("dashboard")}
        />
      )}

      {page === "done" && (
        <div className="done-wrap">
          <div className="done-card">
            <div className="done-icon">✅</div>
            <div className="done-title">Formulário enviado!</div>
            <div className="done-desc">Os dados foram coletados com sucesso e serão enviados para a equipe responsável.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn--primary" onClick={() => goTo("dashboard")}>Meus Formulários</button>
              {currentFormId && <button className="btn" onClick={() => goTo("fill", currentFormId)}>Preencher outro</button>}
            </div>
          </div>
        </div>
      )}

      {page === "responses" && currentForm && (
        <Responses form={currentForm} onBack={() => goTo("dashboard")} />
      )}

      {/* Modals */}
      {showShare && currentForm && (
        <ShareModal
          form={currentForm}
          onClose={() => setShowShare(false)}
          onUpdateEmails={(emails) => handleUpdateForm({ emails })}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className="toast">{toast}</div>
        </div>
      )}
    </>
  );
}
