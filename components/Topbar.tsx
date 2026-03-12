"use client";
import { Save, Eye, Share2, Plus, ArrowLeft, Loader2 } from "lucide-react";

interface TopbarProps {
  page: string;
  formName?: string;
  saving?: boolean;
  onBack: () => void;
  onPreview?: () => void;
  onShare?: () => void;
  onCreate?: () => void;
  onNameChange?: (name: string) => void;
}

export default function Topbar({ page, formName, saving, onBack, onPreview, onShare, onCreate, onNameChange }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="topbar-brand" onClick={onBack}>
        <span style={{ fontSize: 22 }}>📋</span> LegalForms
      </div>
      <div className="topbar-center">
        {page === "builder" && formName !== undefined && (
          <input
            className="topbar-input"
            value={formName}
            onChange={(e) => onNameChange?.(e.target.value)}
            placeholder="Nome do formulário"
          />
        )}
      </div>
      <div className="topbar-right">
        {page === "builder" && (
          <>
            {saving && (
              <span className="topbar-save-indicator">
                <Loader2 size={14} style={{ animation: "spin .6s linear infinite" }} /> Salvando...
              </span>
            )}
            <button className="topbar-btn" onClick={onPreview}>
              <Eye size={14} /> Preencher
            </button>
            <button className="topbar-btn" onClick={onShare}>
              <Share2 size={14} /> Compartilhar
            </button>
          </>
        )}
        {page === "responses" && (
          <button className="topbar-btn" onClick={onBack}>
            <ArrowLeft size={14} /> Voltar
          </button>
        )}
        {page === "dashboard" && (
          <button className="topbar-btn topbar-btn--filled" onClick={onCreate}>
            <Plus size={14} /> Criar
          </button>
        )}
        {(page === "fill" || page === "done") && (
          <button className="topbar-btn" onClick={onBack}>
            <ArrowLeft size={14} /> Meus Formulários
          </button>
        )}
      </div>
    </div>
  );
}
