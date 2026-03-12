"use client";
import { useState } from "react";
import { GripVertical, ChevronUp, ChevronDown, Trash2, Zap } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Form, FormField } from "@/lib/types";
import { FIELD_TYPES, FIELD_CATEGORIES } from "@/lib/field-definitions";
import { cn } from "@/lib/utils";

interface BuilderProps {
  form: Form;
  onUpdateForm: (updates: Partial<Form>) => void;
}

function SortableFieldCard({ field, isSelected, onSelect, onDelete, onMove }: {
  field: FormField; isSelected: boolean;
  onSelect: () => void; onDelete: () => void;
  onMove: (dir: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isSmart = field.type === "socios" || field.type === "alt_events";
  const isLayout = field.type === "heading" || field.type === "separator";

  if (field.type === "separator") {
    return (
      <div ref={setNodeRef} style={style} className={cn("field-card", "is-heading", isSelected && "selected")} onClick={onSelect}>
        <div className="field-card-grip" {...attributes} {...listeners}><GripVertical size={14} /></div>
        <div style={{ flex: 1, borderTop: "2px dashed var(--border)", margin: "4px 0" }} />
        <div className="field-card-actions">
          <button className="btn btn--icon-sm btn--ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}
      className={cn("field-card", isSelected && "selected", isLayout && "is-heading", isSmart && "is-smart")}
      onClick={onSelect}
    >
      <div className="field-card-grip" {...attributes} {...listeners}><GripVertical size={14} /></div>
      <div className="field-card-body">
        <div className="field-card-label">
          {field.label}
          {field.required && <span className="field-card-required">*</span>}
        </div>
        {!isLayout && !isSmart && (
          <div className="field-card-type">{FIELD_TYPES.find((t) => t.type === field.type)?.label || field.type}</div>
        )}
        {isSmart && (
          <div className="field-card-type" style={{ color: "#c06000" }}>
            <Zap size={12} style={{ display: "inline", marginRight: 4 }} />
            Campo inteligente — expande no preenchimento
          </div>
        )}
      </div>
      <div className="field-card-actions">
        <button className="btn btn--icon-sm btn--ghost" onClick={(e) => { e.stopPropagation(); onMove(-1); }}><ChevronUp size={14} /></button>
        <button className="btn btn--icon-sm btn--ghost" onClick={(e) => { e.stopPropagation(); onMove(1); }}><ChevronDown size={14} /></button>
        <button className="btn btn--icon-sm btn--ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

export default function Builder({ form, onUpdateForm }: BuilderProps) {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const selectedField = form.fields.find((f) => f.id === selectedFieldId);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const addField = (type: string) => {
    const ft = FIELD_TYPES.find((t) => t.type === type);
    const nf: FormField = {
      id: "f" + Math.random().toString(36).slice(2, 8),
      type: type as any,
      label: ft?.label || type,
      required: false,
      placeholder: "",
      options: ["select", "radio", "checkbox"].includes(type) ? ["Opção 1", "Opção 2"] : undefined,
    };
    onUpdateForm({ fields: [...form.fields, nf] });
    setSelectedFieldId(nf.id);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    onUpdateForm({ fields: form.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)) });
  };

  const deleteField = (fieldId: string) => {
    onUpdateForm({ fields: form.fields.filter((f) => f.id !== fieldId) });
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const moveField = (fieldId: string, dir: number) => {
    const idx = form.fields.findIndex((f) => f.id === fieldId);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= form.fields.length) return;
    const arr = [...form.fields];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    onUpdateForm({ fields: arr });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = form.fields.findIndex((f) => f.id === active.id);
    const newIdx = form.fields.findIndex((f) => f.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const arr = [...form.fields];
    const [moved] = arr.splice(oldIdx, 1);
    arr.splice(newIdx, 0, moved);
    onUpdateForm({ fields: arr });
  };

  return (
    <div className="builder">
      {/* LEFT: Elements Panel */}
      <div className="builder-left">
        {FIELD_CATEGORIES.map((cat) => (
          <div key={cat.key}>
            <div className="element-category">{cat.title}</div>
            {FIELD_TYPES.filter((t) => t.cat === cat.key).map((t) => (
              <button key={t.type} className="element-btn" onClick={() => addField(t.type)}>
                <div className="element-icon">{t.icon}</div>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* CENTER: Canvas */}
      <div className="builder-center">
        <div className="canvas">
          {form.fields.length === 0 && (
            <div className="canvas-empty">
              <div className="canvas-empty-icon">📝</div>
              <div className="canvas-empty-text">Adicione campos pela barra lateral</div>
              <div className="canvas-empty-sub">Arraste e solte para reordenar</div>
            </div>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={form.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              {form.fields.map((f) => (
                <SortableFieldCard
                  key={f.id}
                  field={f}
                  isSelected={selectedFieldId === f.id}
                  onSelect={() => setSelectedFieldId(f.id)}
                  onDelete={() => deleteField(f.id)}
                  onMove={(dir) => moveField(f.id, dir)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* RIGHT: Properties Panel */}
      <div className="builder-right">
        {selectedField ? (
          <>
            <div className="prop-title">Propriedades</div>
            <div className="prop-section">
              <div className="form-group">
                <label className="form-label">Rótulo</label>
                <input className="input" value={selectedField.label} onChange={(e) => updateField(selectedField.id, { label: e.target.value })} />
              </div>
              {selectedField.type !== "heading" && selectedField.type !== "separator" &&
               selectedField.type !== "socios" && selectedField.type !== "alt_events" && (
                <>
                  <div className="form-group">
                    <label className="form-label">Placeholder</label>
                    <input className="input" value={selectedField.placeholder || ""} onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descrição (opcional)</label>
                    <input className="input" value={selectedField.description || ""} onChange={(e) => updateField(selectedField.id, { description: e.target.value })} placeholder="Texto de ajuda para o campo" />
                  </div>
                  <div className="form-group">
                    <div className="toggle" onClick={() => updateField(selectedField.id, { required: !selectedField.required })}>
                      <div className={cn("toggle-track", selectedField.required && "active")} />
                      Obrigatório
                    </div>
                  </div>
                </>
              )}
            </div>

            {(selectedField.type === "select" || selectedField.type === "radio" || selectedField.type === "checkbox") && (
              <div className="prop-section">
                <div className="form-group">
                  <label className="form-label">Opções (uma por linha)</label>
                  <textarea
                    className="input"
                    value={(selectedField.options || []).join("\n")}
                    onChange={(e) => updateField(selectedField.id, { options: e.target.value.split("\n") })}
                    rows={5}
                  />
                </div>
              </div>
            )}

            <div style={{ marginTop: 8 }}>
              <button className="btn btn--sm" style={{ color: "var(--danger)" }} onClick={() => deleteField(selectedField.id)}>
                <Trash2 size={14} /> Remover campo
              </button>
            </div>
          </>
        ) : (
          <div className="prop-empty">Selecione um campo para editar suas propriedades</div>
        )}
      </div>
    </div>
  );
}
