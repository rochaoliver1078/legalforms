"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  GripVertical, ChevronUp, ChevronDown, Trash2, Zap, Copy, Undo2, Redo2,
  Smartphone, Monitor, Palette, Eye, Settings, Layers, GitBranch, Star
} from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Form, FormField, HistoryEntry, ConditionalRule } from "@/lib/types";
import { FIELD_TYPES, FIELD_CATEGORIES, DEFAULT_TABLE_COLUMNS } from "@/lib/field-definitions";
import { cn, uid } from "@/lib/utils";

interface BuilderProps {
  form: Form;
  onUpdateForm: (updates: Partial<Form>) => void;
}

function SortableCard({ field, isSelected, onSelect, onDelete, onDuplicate, onMove, pageNum }: {
  field: FormField; isSelected: boolean; pageNum?: number;
  onSelect: () => void; onDelete: () => void; onDuplicate: () => void; onMove: (d: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isSmart = field.type === "socios" || field.type === "alt_events";
  const isLayout = field.type === "heading" || field.type === "separator";

  if (field.type === "page_break") {
    return (
      <div ref={setNodeRef} style={style} className="field-card is-page-break" onClick={onSelect}>
        <div className="field-card-grip" {...attributes} {...listeners}><GripVertical size={14} /></div>
        <div className="page-break-line"><Layers size={14} /> Página {(pageNum || 1) + 1}</div>
        <div className="field-card-actions">
          <button className="btn btn--icon-sm btn--ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
        </div>
      </div>
    );
  }

  if (field.type === "separator") {
    return (
      <div ref={setNodeRef} style={style} className={cn("field-card is-heading", isSelected && "selected")} onClick={onSelect}>
        <div className="field-card-grip" {...attributes} {...listeners}><GripVertical size={14} /></div>
        <div style={{ flex: 1, borderTop: "2px dashed var(--border)", margin: "4px 0" }} />
        <div className="field-card-actions">
          <button className="btn btn--icon-sm btn--ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
        </div>
      </div>
    );
  }

  const ft = FIELD_TYPES.find((t) => t.type === field.type);
  return (
    <div ref={setNodeRef} style={style}
      className={cn("field-card", isSelected && "selected", isLayout && "is-heading", isSmart && "is-smart", field.conditional && "has-condition")}
      onClick={onSelect}>
      <div className="field-card-grip" {...attributes} {...listeners}><GripVertical size={14} /></div>
      <div className="field-card-body">
        <div className="field-card-label">
          {field.label}{field.required && <span className="field-card-required">*</span>}
          {field.conditional && <GitBranch size={12} style={{ marginLeft: 6, color: "var(--warning)" }} />}
        </div>
        {!isLayout && !isSmart && <div className="field-card-type">{ft?.label || field.type}</div>}
        {isSmart && <div className="field-card-type" style={{ color: "#c06000" }}><Zap size={12} style={{ display: "inline", marginRight: 4 }} />Inteligente</div>}
      </div>
      <div className="field-card-actions">
        <button className="btn btn--icon-sm btn--ghost" title="Duplicar" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}><Copy size={14} /></button>
        <button className="btn btn--icon-sm btn--ghost" onClick={(e) => { e.stopPropagation(); onMove(-1); }}><ChevronUp size={14} /></button>
        <button className="btn btn--icon-sm btn--ghost" onClick={(e) => { e.stopPropagation(); onMove(1); }}><ChevronDown size={14} /></button>
        <button className="btn btn--icon-sm btn--ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

export default function Builder({ form, onUpdateForm }: BuilderProps) {
  const [selId, setSelId] = useState<string | null>(null);
  const [preview, setPreview] = useState<"desktop" | "mobile">("desktop");
  const [rightTab, setRightTab] = useState<"props" | "theme" | "conditions">("props");
  const [history, setHistory] = useState<HistoryEntry[]>([{ fields: form.fields, timestamp: Date.now() }]);
  const [histIdx, setHistIdx] = useState(0);

  const sel = form.fields.find((f) => f.id === selId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Pages calculation
  const pages: FormField[][] = [[]];
  form.fields.forEach((f) => {
    if (f.type === "page_break") pages.push([]);
    else pages[pages.length - 1].push(f);
  });

  // Save to history
  const pushHistory = useCallback((fields: FormField[]) => {
    setHistory((h) => {
      const trimmed = h.slice(0, histIdx + 1);
      return [...trimmed, { fields, timestamp: Date.now() }].slice(-50);
    });
    setHistIdx((i) => i + 1);
  }, [histIdx]);

  const updateFields = (fields: FormField[]) => {
    pushHistory(fields);
    onUpdateForm({ fields });
  };

  // Undo / Redo
  const undo = () => {
    if (histIdx <= 0) return;
    const ni = histIdx - 1;
    setHistIdx(ni);
    onUpdateForm({ fields: history[ni].fields });
  };
  const redo = () => {
    if (histIdx >= history.length - 1) return;
    const ni = histIdx + 1;
    setHistIdx(ni);
    onUpdateForm({ fields: history[ni].fields });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const addField = (type: string) => {
    const ft = FIELD_TYPES.find((t) => t.type === type);
    const nf: FormField = {
      id: uid(), type: type as any, label: ft?.label || type, required: false, placeholder: "",
      options: ["select", "radio", "checkbox"].includes(type) ? ["Opção 1", "Opção 2"] : undefined,
      tableColumns: type === "table" ? DEFAULT_TABLE_COLUMNS : undefined,
      maxRating: type === "rating" ? 5 : undefined,
    };
    updateFields([...form.fields, nf]);
    setSelId(nf.id);
  };

  const duplicateField = (fieldId: string) => {
    const f = form.fields.find((x) => x.id === fieldId);
    if (!f) return;
    const idx = form.fields.indexOf(f);
    const dup = { ...f, id: uid(), label: f.label + " (cópia)" };
    const arr = [...form.fields];
    arr.splice(idx + 1, 0, dup);
    updateFields(arr);
    setSelId(dup.id);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    updateFields(form.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  };

  const deleteField = (fieldId: string) => {
    updateFields(form.fields.filter((f) => f.id !== fieldId));
    if (selId === fieldId) setSelId(null);
  };

  const moveField = (fieldId: string, dir: number) => {
    const idx = form.fields.findIndex((f) => f.id === fieldId);
    if (idx < 0) return;
    const ni = idx + dir;
    if (ni < 0 || ni >= form.fields.length) return;
    const arr = [...form.fields];
    [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
    updateFields(arr);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oi = form.fields.findIndex((f) => f.id === active.id);
    const ni = form.fields.findIndex((f) => f.id === over.id);
    if (oi < 0 || ni < 0) return;
    const arr = [...form.fields];
    const [moved] = arr.splice(oi, 1);
    arr.splice(ni, 0, moved);
    updateFields(arr);
  };

  // Theme editor
  const theme = form.theme || { primaryColor: "#FF6100", bgColor: "#fff8f0", cardBg: "#ffffff", textColor: "#1a1a2e", fontFamily: "Inter", borderRadius: "rounded" as const };
  const setTheme = (k: string, v: string) => onUpdateForm({ theme: { ...theme, [k]: v } });

  // Count page breaks before a field
  let pbCount = 0;

  return (
    <div className="builder">
      {/* LEFT panel */}
      <div className="builder-left">
        <div className="builder-toolbar">
          <button className={cn("toolbar-btn", histIdx <= 0 && "disabled")} onClick={undo} title="Desfazer (Ctrl+Z)"><Undo2 size={16} /></button>
          <button className={cn("toolbar-btn", histIdx >= history.length - 1 && "disabled")} onClick={redo} title="Refazer (Ctrl+Y)"><Redo2 size={16} /></button>
          <span className="toolbar-divider" />
          <button className={cn("toolbar-btn", preview === "desktop" && "active")} onClick={() => setPreview("desktop")} title="Desktop"><Monitor size={16} /></button>
          <button className={cn("toolbar-btn", preview === "mobile" && "active")} onClick={() => setPreview("mobile")} title="Mobile"><Smartphone size={16} /></button>
        </div>
        {FIELD_CATEGORIES.map((cat) => (
          <div key={cat.key}>
            <div className="element-category">{cat.title}</div>
            {FIELD_TYPES.filter((t) => t.cat === cat.key).map((t) => (
              <button key={t.type} className="element-btn" onClick={() => addField(t.type)}>
                <div className="element-icon">{t.icon}</div><span>{t.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* CENTER canvas */}
      <div className="builder-center">
        {pages.length > 1 && (
          <div className="page-tabs">
            {pages.map((_, i) => (
              <div key={i} className="page-tab">Pág {i + 1} ({pages[i].length})</div>
            ))}
          </div>
        )}
        <div className={cn("canvas", preview === "mobile" && "canvas--mobile")}>
          {form.fields.length === 0 && (
            <div className="canvas-empty">
              <div className="canvas-empty-icon">📝</div>
              <div className="canvas-empty-text">Adicione campos pela barra lateral</div>
              <div className="canvas-empty-sub">Arraste e solte para reordenar</div>
            </div>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={form.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              {form.fields.map((f) => {
                if (f.type === "page_break") pbCount++;
                return (
                  <SortableCard key={f.id} field={f} isSelected={selId === f.id} pageNum={pbCount}
                    onSelect={() => setSelId(f.id)} onDelete={() => deleteField(f.id)}
                    onDuplicate={() => duplicateField(f.id)} onMove={(d) => moveField(f.id, d)} />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* RIGHT panel */}
      <div className="builder-right">
        <div className="right-tabs">
          <button className={cn("right-tab", rightTab === "props" && "active")} onClick={() => setRightTab("props")}><Settings size={14} /> Propriedades</button>
          <button className={cn("right-tab", rightTab === "theme" && "active")} onClick={() => setRightTab("theme")}><Palette size={14} /> Tema</button>
          <button className={cn("right-tab", rightTab === "conditions" && "active")} onClick={() => setRightTab("conditions")}><GitBranch size={14} /> Condicional</button>
        </div>

        {rightTab === "props" && sel ? (
          <div className="prop-section">
            <div className="form-group">
              <label className="form-label">Rótulo</label>
              <input className="input" value={sel.label} onChange={(e) => updateField(sel.id, { label: e.target.value })} />
            </div>
            {!["heading", "separator", "page_break", "socios", "alt_events", "lgpd"].includes(sel.type) && (
              <>
                <div className="form-group">
                  <label className="form-label">Placeholder</label>
                  <input className="input" value={sel.placeholder || ""} onChange={(e) => updateField(sel.id, { placeholder: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <input className="input" value={sel.description || ""} onChange={(e) => updateField(sel.id, { description: e.target.value })} placeholder="Texto de ajuda" />
                </div>
                <div className="form-group">
                  <div className="toggle" onClick={() => updateField(sel.id, { required: !sel.required })}>
                    <div className={cn("toggle-track", sel.required && "active")} />Obrigatório
                  </div>
                </div>
              </>
            )}
            {["select", "radio", "checkbox"].includes(sel.type) && (
              <div className="form-group">
                <label className="form-label">Opções (uma por linha)</label>
                <textarea className="input" value={(sel.options || []).join("\n")} rows={5}
                  onChange={(e) => updateField(sel.id, { options: e.target.value.split("\n") })} />
              </div>
            )}
            {sel.type === "rating" && (
              <div className="form-group">
                <label className="form-label">Máximo de estrelas</label>
                <input className="input" type="number" min={3} max={10} value={sel.maxRating || 5}
                  onChange={(e) => updateField(sel.id, { maxRating: parseInt(e.target.value) })} />
              </div>
            )}
            <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
              <button className="btn btn--sm btn--ghost" onClick={() => duplicateField(sel.id)}><Copy size={14} /> Duplicar</button>
              <button className="btn btn--sm" style={{ color: "var(--danger)" }} onClick={() => deleteField(sel.id)}><Trash2 size={14} /> Remover</button>
            </div>
          </div>
        ) : rightTab === "props" ? (
          <div className="prop-empty">Selecione um campo para editar</div>
        ) : null}

        {rightTab === "theme" && (
          <div className="prop-section">
            <div className="form-group"><label className="form-label">Cor primária</label><input type="color" value={theme.primaryColor} onChange={(e) => setTheme("primaryColor", e.target.value)} style={{ width: "100%", height: 36, cursor: "pointer" }} /></div>
            <div className="form-group"><label className="form-label">Fundo</label><input type="color" value={theme.bgColor} onChange={(e) => setTheme("bgColor", e.target.value)} style={{ width: "100%", height: 36, cursor: "pointer" }} /></div>
            <div className="form-group"><label className="form-label">Cor do card</label><input type="color" value={theme.cardBg} onChange={(e) => setTheme("cardBg", e.target.value)} style={{ width: "100%", height: 36, cursor: "pointer" }} /></div>
            <div className="form-group"><label className="form-label">Cor do texto</label><input type="color" value={theme.textColor} onChange={(e) => setTheme("textColor", e.target.value)} style={{ width: "100%", height: 36, cursor: "pointer" }} /></div>
            <div className="form-group"><label className="form-label">Fonte</label>
              <select className="input" value={theme.fontFamily} onChange={(e) => setTheme("fontFamily", e.target.value)}>
                <option value="Inter">Inter</option><option value="Roboto">Roboto</option>
                <option value="Poppins">Poppins</option><option value="system-ui">System</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Bordas</label>
              <select className="input" value={theme.borderRadius} onChange={(e) => setTheme("borderRadius", e.target.value)}>
                <option value="sharp">Retas</option><option value="rounded">Arredondadas</option><option value="pill">Pílula</option>
              </select>
            </div>
            <hr style={{ border: "none", borderTop: "1px solid var(--border-light)", margin: "12px 0" }} />
            <div className="form-group">
              <label className="form-label">🖼️ Logo (URL)</label>
              <input className="input" placeholder="https://... (PNG/SVG)" value={theme.logoUrl || ""} onChange={(e) => setTheme("logoUrl", e.target.value)} />
              {theme.logoUrl && <img src={theme.logoUrl} alt="Preview" style={{ height: 32, objectFit: "contain", marginTop: 8 }} />}
            </div>
            <div className="form-group">
              <label className="form-label">🏔️ Capa (URL)</label>
              <input className="input" placeholder="https://... (banner)" value={theme.coverUrl || ""} onChange={(e) => setTheme("coverUrl", e.target.value)} />
              {theme.coverUrl && <img src={theme.coverUrl} alt="Preview" style={{ width: "100%", height: 60, objectFit: "cover", borderRadius: 6, marginTop: 8 }} />}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>Logo e capa aparecem no formulário público.</div>
          </div>
        )}

        {rightTab === "conditions" && sel && !["heading", "separator", "page_break"].includes(sel.type) ? (
          <div className="prop-section">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Exibir este campo apenas quando...</div>
            <div className="form-group"><label className="form-label">Campo de referência</label>
              <select className="input" value={sel.conditional?.fieldId || ""} onChange={(e) => updateField(sel.id, { conditional: { ...sel.conditional, fieldId: e.target.value, operator: sel.conditional?.operator || "equals", value: sel.conditional?.value || "", action: "show" } as ConditionalRule })}>
                <option value="">Nenhum (sempre visível)</option>
                {form.fields.filter((f) => f.id !== sel.id && !["heading", "separator", "page_break"].includes(f.type)).map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>
            {sel.conditional?.fieldId && (
              <>
                <div className="form-group"><label className="form-label">Condição</label>
                  <select className="input" value={sel.conditional.operator} onChange={(e) => updateField(sel.id, { conditional: { ...sel.conditional!, operator: e.target.value as any } })}>
                    <option value="equals">É igual a</option><option value="not_equals">É diferente de</option>
                    <option value="contains">Contém</option><option value="not_empty">Não está vazio</option><option value="empty">Está vazio</option>
                  </select>
                </div>
                {!["not_empty", "empty"].includes(sel.conditional.operator) && (
                  <div className="form-group"><label className="form-label">Valor</label>
                    <input className="input" value={sel.conditional.value} onChange={(e) => updateField(sel.id, { conditional: { ...sel.conditional!, value: e.target.value } })} />
                  </div>
                )}
                <button className="btn btn--sm btn--ghost" style={{ color: "var(--danger)", marginTop: 8 }} onClick={() => updateField(sel.id, { conditional: undefined })}>Remover condição</button>
              </>
            )}
          </div>
        ) : rightTab === "conditions" ? (
          <div className="prop-empty">{sel ? "Este campo não suporta condições" : "Selecione um campo"}</div>
        ) : null}
      </div>
    </div>
  );
}
