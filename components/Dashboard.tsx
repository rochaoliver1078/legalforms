"use client";
import { useState } from "react";
import { Search, Edit3, Eye, Share2, Trash2, Plus, LayoutGrid, List, FileText, BarChart3, Inbox } from "lucide-react";
import { Form } from "@/lib/types";
import { FORM_TEMPLATES } from "@/lib/field-definitions";
import { formatDate, uid } from "@/lib/utils";

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
}

export default function Dashboard({
  forms, search, onSearchChange, onCreateForm, onEditForm, onFillForm, onShareForm, onDeleteForm, onViewResponses
}: DashboardProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showTemplates, setShowTemplates] = useState(false);

  const filtered = search
    ? forms.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : forms;

  return (
    <div className="dashboard">
      {/* Templates Section */}
      {forms.length === 0 || showTemplates ? (
        <div className="templates-section">
          <div className="templates-title">Comece com um template</div>
          <div className="templates-grid">
            {FORM_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="template-card"
                onClick={() => onCreateForm(tpl.id)}
              >
                <div className="template-card-icon">{tpl.icon}</div>
                <div className="template-card-name">{tpl.name}</div>
                <div className="template-card-desc">{tpl.description}</div>
              </div>
            ))}
          </div>
          {forms.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button className="btn btn--ghost btn--sm" onClick={() => setShowTemplates(false)}>
                Fechar templates
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Header */}
      <div className="dashboard-header">
        <h2 className="dashboard-title">Meus Formulários</h2>
        <div className="dashboard-actions">
          <div className="search-box">
            <Search size={16} />
            <input
              placeholder="Buscar formulário..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="view-toggle">
            <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}>
              <LayoutGrid size={16} />
            </button>
            <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}>
              <List size={16} />
            </button>
          </div>
          {!showTemplates && (
            <button className="btn btn--sm btn--ghost" onClick={() => setShowTemplates(true)} title="Usar template">
              <FileText size={14} /> Templates
            </button>
          )}
          <button className="btn btn--primary" onClick={() => onCreateForm()}>
            <Plus size={16} /> Criar Formulário
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="forms-grid">
          {filtered.map((f) => (
            <div key={f.id} className="form-card" onClick={() => onEditForm(f.id)}>
              <div className="form-card-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn btn--icon-sm btn--ghost" title="Editar" onClick={() => onEditForm(f.id)}>
                  <Edit3 size={14} />
                </button>
                <button className="btn btn--icon-sm btn--ghost" title="Preencher" onClick={() => onFillForm(f.id)}>
                  <Eye size={14} />
                </button>
                <button className="btn btn--icon-sm btn--ghost" title="Respostas" onClick={() => onViewResponses(f.id)}>
                  <BarChart3 size={14} />
                </button>
                <button className="btn btn--icon-sm btn--ghost" title="Compartilhar" onClick={() => onShareForm(f.id)}>
                  <Share2 size={14} />
                </button>
                <button className="btn btn--icon-sm btn--ghost" title="Excluir" onClick={() => onDeleteForm(f.id)} style={{ color: "var(--danger)" }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="form-card-icon" style={{ background: f.color + "18", color: f.color }}>
                {f.icon}
              </div>
              <div className="form-card-name">{f.name}</div>
              <div className="form-card-meta">
                {formatDate(f.created_at)} · {(f.fields || []).length} campos
              </div>
              <div className="form-card-stats">
                <div className="form-card-stat">
                  <Inbox size={13} /> {f.response_count || 0} respostas
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: .5 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Nenhum formulário encontrado</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Crie seu primeiro formulário ou use um template</div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="forms-list">
          {filtered.map((f) => (
            <div key={f.id} className="form-list-item" onClick={() => onEditForm(f.id)}>
              <div className="form-list-icon" style={{ background: f.color + "18", color: f.color }}>
                {f.icon}
              </div>
              <div className="form-list-info">
                <div className="form-list-name">{f.name}</div>
                <div className="form-list-meta">{formatDate(f.created_at)} · {(f.fields || []).length} campos</div>
              </div>
              <div className="form-list-badge">{f.response_count || 0} respostas</div>
              <div className="form-list-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn btn--icon-sm btn--ghost" title="Editar" onClick={() => onEditForm(f.id)}><Edit3 size={14} /></button>
                <button className="btn btn--icon-sm btn--ghost" title="Preencher" onClick={() => onFillForm(f.id)}><Eye size={14} /></button>
                <button className="btn btn--icon-sm btn--ghost" title="Respostas" onClick={() => onViewResponses(f.id)}><BarChart3 size={14} /></button>
                <button className="btn btn--icon-sm btn--ghost" title="Compartilhar" onClick={() => onShareForm(f.id)}><Share2 size={14} /></button>
                <button className="btn btn--icon-sm btn--ghost" title="Excluir" onClick={() => onDeleteForm(f.id)} style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Nenhum formulário encontrado</div>
          )}
        </div>
      )}
    </div>
  );
}
