"use client";
import { useState, useMemo } from "react";
import {
  Search, Edit3, Eye, Share2, Trash2, Plus, LayoutGrid, List, FileText, BarChart3,
  Inbox, FolderOpen, Tag, Archive, Copy, ChevronDown, CheckSquare, Square, Folder, X
} from "lucide-react";
import { Form, FormFolder } from "@/lib/types";
import { FORM_TEMPLATES } from "@/lib/field-definitions";
import { formatDate, cn } from "@/lib/utils";

interface DashboardProps {
  forms: Form[];
  search: string;
  onSearchChange: (s: string) => void;
  onCreateForm: (tplId?: string) => void;
  onEditForm: (id: string) => void;
  onFillForm: (id: string) => void;
  onShareForm: (id: string) => void;
  onDeleteForm: (id: string) => void;
  onViewResponses: (id: string) => void;
  onDuplicateForm: (id: string) => void;
  onArchiveForm: (id: string) => void;
  onUpdateForm: (id: string, updates: Partial<Form>) => void;
  loading?: boolean;
}

export default function Dashboard({
  forms, search, onSearchChange, onCreateForm, onEditForm, onFillForm, onShareForm,
  onDeleteForm, onViewResponses, onDuplicateForm, onArchiveForm, onUpdateForm, loading
}: DashboardProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "archived">("all");
  const [filterTag, setFilterTag] = useState<string>("");
  const [filterFolder, setFilterFolder] = useState<string>("");
  const [showTagInput, setShowTagInput] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const isBulk = selectedIds.length > 0;

  // Get all tags across forms
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    forms.forEach((f) => (f.tags || []).forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [forms]);

  // Get all folders
  const allFolders = useMemo(() => {
    const folders = new Set<string>();
    forms.forEach((f) => { if (f.folder_id) folders.add(f.folder_id); });
    return Array.from(folders);
  }, [forms]);

  // Filter forms
  const filtered = useMemo(() => {
    let list = forms;
    if (filter === "active") list = list.filter((f) => f.status !== "archived");
    if (filter === "archived") list = list.filter((f) => f.status === "archived");
    if (filter === "all") list = list.filter((f) => f.status !== "archived");
    if (filterTag) list = list.filter((f) => (f.tags || []).includes(filterTag));
    if (filterFolder) list = list.filter((f) => f.folder_id === filterFolder);
    if (search) list = list.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [forms, filter, filterTag, filterFolder, search]);

  const toggleSelect = (id: string) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const selectAll = () => setSelectedIds(filtered.map((f) => f.id));
  const clearSelection = () => setSelectedIds([]);

  const bulkDelete = () => { if (confirm(`Excluir ${selectedIds.length} formulários?`)) { selectedIds.forEach(onDeleteForm); clearSelection(); }};
  const bulkArchive = () => { selectedIds.forEach(onArchiveForm); clearSelection(); };

  const addTag = (formId: string) => {
    if (!newTag.trim()) return;
    const form = forms.find((f) => f.id === formId);
    const tags = [...(form?.tags || []), newTag.trim()];
    onUpdateForm(formId, { tags });
    setNewTag("");
    setShowTagInput(null);
  };

  const removeTag = (formId: string, tag: string) => {
    const form = forms.find((f) => f.id === formId);
    onUpdateForm(formId, { tags: (form?.tags || []).filter((t) => t !== tag) });
  };

  // Skeleton loading
  if (loading) return (
    <div className="dashboard">
      <div className="dashboard-header"><div className="skeleton" style={{ width: 200, height: 28 }} /></div>
      <div className="forms-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="form-card skeleton-card">
            <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
            <div className="skeleton" style={{ width: "70%", height: 16, marginTop: 12 }} />
            <div className="skeleton" style={{ width: "50%", height: 12, marginTop: 8 }} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      {/* Templates */}
      {(forms.length === 0 || showTemplates) && (
        <div className="templates-section">
          <div className="templates-title">Comece com um template</div>
          <div className="templates-grid">
            {FORM_TEMPLATES.map((tpl) => (
              <div key={tpl.id} className="template-card" onClick={() => onCreateForm(tpl.id)}>
                <div className="template-card-icon">{tpl.icon}</div>
                <div className="template-card-name">{tpl.name}</div>
                <div className="template-card-desc">{tpl.description}</div>
              </div>
            ))}
          </div>
          {forms.length > 0 && <div style={{ textAlign: "center", marginTop: 12 }}><button className="btn btn--ghost btn--sm" onClick={() => setShowTemplates(false)}>Fechar</button></div>}
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <h2 className="dashboard-title">Meus Formulários</h2>
        <div className="dashboard-actions">
          <div className="search-box"><Search size={16} /><input placeholder="Buscar..." value={search} onChange={(e) => onSearchChange(e.target.value)} /></div>
          <div className="view-toggle">
            <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}><LayoutGrid size={16} /></button>
            <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}><List size={16} /></button>
          </div>
          {!showTemplates && <button className="btn btn--sm btn--ghost" onClick={() => setShowTemplates(true)}><FileText size={14} /> Templates</button>}
          <button className="btn btn--primary" onClick={() => onCreateForm()}><Plus size={16} /> Criar</button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filter-bar">
        <div className="filter-pills">
          <button className={cn("filter-pill", filter === "all" && "active")} onClick={() => setFilter("all")}>Todos ({forms.filter((f) => f.status !== "archived").length})</button>
          <button className={cn("filter-pill", filter === "active" && "active")} onClick={() => setFilter("active")}>Ativos</button>
          <button className={cn("filter-pill", filter === "archived" && "active")} onClick={() => setFilter("archived")}><Archive size={13} /> Arquivados</button>
        </div>
        {allTags.length > 0 && (
          <div className="filter-pills">
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Tags:</span>
            {allTags.map((t) => (
              <button key={t} className={cn("filter-pill filter-pill--tag", filterTag === t && "active")} onClick={() => setFilterTag(filterTag === t ? "" : t)}>
                <Tag size={11} /> {t}
              </button>
            ))}
          </div>
        )}
        {allFolders.length > 0 && (
          <div className="filter-pills">
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Pastas:</span>
            {allFolders.map((f) => (
              <button key={f} className={cn("filter-pill", filterFolder === f && "active")} onClick={() => setFilterFolder(filterFolder === f ? "" : f)}>
                <Folder size={11} /> {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {isBulk && (
        <div className="bulk-bar">
          <span style={{ fontWeight: 700 }}>{selectedIds.length} selecionado(s)</span>
          <button className="btn btn--sm" onClick={selectAll}>Selecionar todos</button>
          <button className="btn btn--sm" onClick={bulkArchive}><Archive size={14} /> Arquivar</button>
          <button className="btn btn--sm" style={{ color: "var(--danger)" }} onClick={bulkDelete}><Trash2 size={14} /> Excluir</button>
          <button className="btn btn--sm btn--ghost" onClick={clearSelection}><X size={14} /> Cancelar</button>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="forms-grid">
          {filtered.map((f) => (
            <div key={f.id} className={cn("form-card", selectedIds.includes(f.id) && "form-card--selected", f.status === "archived" && "form-card--archived")} onClick={() => isBulk ? toggleSelect(f.id) : onEditForm(f.id)}>
              {/* Select checkbox */}
              <div className="form-card-select" onClick={(e) => { e.stopPropagation(); toggleSelect(f.id); }}>
                {selectedIds.includes(f.id) ? <CheckSquare size={16} style={{ color: "var(--primary)" }} /> : <Square size={16} />}
              </div>
              <div className="form-card-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn btn--icon-sm btn--ghost" title="Editar" onClick={() => onEditForm(f.id)}><Edit3 size={14} /></button>
                <button className="btn btn--icon-sm btn--ghost" title="Preencher" onClick={() => onFillForm(f.id)}><Eye size={14} /></button>
                <button className="btn btn--icon-sm btn--ghost" title="Respostas" onClick={() => onViewResponses(f.id)}><BarChart3 size={14} /></button>
                <button className="btn btn--icon-sm btn--ghost" title="Duplicar" onClick={() => onDuplicateForm(f.id)}><Copy size={14} /></button>
                <button className="btn btn--icon-sm btn--ghost" title="Compartilhar" onClick={() => onShareForm(f.id)}><Share2 size={14} /></button>
                <button className="btn btn--icon-sm btn--ghost" title="Arquivar" onClick={() => onArchiveForm(f.id)}><Archive size={14} /></button>
                <button className="btn btn--icon-sm btn--ghost" title="Excluir" onClick={() => onDeleteForm(f.id)} style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
              </div>
              <div className="form-card-icon" style={{ background: f.color + "18", color: f.color }}>{f.icon}</div>
              <div className="form-card-name">{f.name}</div>
              <div className="form-card-meta">{formatDate(f.created_at)} · {(f.fields || []).length} campos</div>
              {/* Tags */}
              {(f.tags && f.tags.length > 0) && (
                <div className="form-card-tags">
                  {f.tags.map((t) => <span key={t} className="tag-badge" onClick={(e) => { e.stopPropagation(); removeTag(f.id, t); }}>{t} ×</span>)}
                </div>
              )}
              <div className="form-card-bottom">
                <div className="form-card-stat"><Inbox size={13} /> {f.response_count || 0}</div>
                <button className="tag-add-btn" onClick={(e) => { e.stopPropagation(); setShowTagInput(showTagInput === f.id ? null : f.id); }}><Tag size={12} /></button>
              </div>
              {showTagInput === f.id && (
                <div className="tag-input-row" onClick={(e) => e.stopPropagation()}>
                  <input className="input input--sm" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Nova tag..." onKeyDown={(e) => e.key === "Enter" && addTag(f.id)} autoFocus />
                  <button className="btn btn--sm btn--primary" onClick={() => addTag(f.id)}>+</button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: .5 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Nenhum formulário encontrado</div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="forms-list">
          {filtered.map((f) => (
            <div key={f.id} className={cn("form-list-item", selectedIds.includes(f.id) && "selected")} onClick={() => isBulk ? toggleSelect(f.id) : onEditForm(f.id)}>
              <div className="form-card-select" onClick={(e) => { e.stopPropagation(); toggleSelect(f.id); }}>
                {selectedIds.includes(f.id) ? <CheckSquare size={16} style={{ color: "var(--primary)" }} /> : <Square size={16} />}
              </div>
              <div className="form-list-icon" style={{ background: f.color + "18", color: f.color }}>{f.icon}</div>
              <div className="form-list-info">
                <div className="form-list-name">{f.name}</div>
                <div className="form-list-meta">{formatDate(f.created_at)} · {(f.fields || []).length} campos</div>
              </div>
              {(f.tags || []).map((t) => <span key={t} className="tag-badge">{t}</span>)}
              <div className="form-list-badge">{f.response_count || 0} resp.</div>
              <div className="form-list-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn btn--icon-sm btn--ghost" onClick={() => onEditForm(f.id)}><Edit3 size={14} /></button>
                <button className="btn btn--icon-sm btn--ghost" onClick={() => onDuplicateForm(f.id)}><Copy size={14} /></button>
                <button className="btn btn--icon-sm btn--ghost" onClick={() => onShareForm(f.id)}><Share2 size={14} /></button>
                <button className="btn btn--icon-sm btn--ghost" onClick={() => onArchiveForm(f.id)}><Archive size={14} /></button>
                <button className="btn btn--icon-sm btn--ghost" onClick={() => onDeleteForm(f.id)} style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
