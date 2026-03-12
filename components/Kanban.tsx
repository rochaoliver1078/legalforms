"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, ChevronRight, Building2, Phone, Mail, Edit3, GripVertical } from "lucide-react";
import { Client, ProcessStatus, PROCESS_STATUS_LABELS, PROCESS_STATUS_COLORS } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

interface KanbanProps {
  onBack: () => void;
  onSelectClient: (client: Client) => void;
}

const COLUMNS: ProcessStatus[] = ["pending", "docs_received", "analyzing", "filed", "completed"];

export default function Kanban({ onBack, onSelectClient }: KanbanProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then((d) => { setClients(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    setDragId(clientId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, status: ProcessStatus) => {
    e.preventDefault();
    if (!dragId) return;
    const client = clients.find((c) => c.id === dragId);
    if (!client || client.process_status === status) { setDragId(null); return; }
    // Optimistic update
    setClients((p) => p.map((c) => (c.id === dragId ? { ...c, process_status: status } : c)));
    setDragId(null);
    await fetch("/api/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: dragId, process_status: status }) });
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };

  if (loading) return (
    <div className="kanban-page"><div className="kanban-header"><div className="skeleton" style={{ width: 200, height: 28 }} /></div>
      <div className="kanban-board">{COLUMNS.map((c) => <div key={c} className="kanban-column"><div className="skeleton" style={{ width: "100%", height: 100 }} /></div>)}</div>
    </div>
  );

  return (
    <div className="kanban-page">
      <div className="kanban-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn--ghost" onClick={onBack}><ArrowLeft size={16} /></button>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>📊 Kanban de Processos</h2>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{clients.length} clientes</span>
        </div>
      </div>

      <div className="kanban-board">
        {COLUMNS.map((status) => {
          const col = clients.filter((c) => c.process_status === status);
          return (
            <div key={status} className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}>
              <div className="kanban-column-header" style={{ borderTopColor: PROCESS_STATUS_COLORS[status] }}>
                <span className="kanban-column-dot" style={{ background: PROCESS_STATUS_COLORS[status] }} />
                <span className="kanban-column-title">{PROCESS_STATUS_LABELS[status]}</span>
                <span className="kanban-column-count">{col.length}</span>
              </div>
              <div className="kanban-column-body">
                {col.map((c) => (
                  <div key={c.id} className={cn("kanban-card", dragId === c.id && "dragging")}
                    draggable onDragStart={(e) => handleDragStart(e, c.id)}
                    onClick={() => onSelectClient(c)}>
                    <div className="kanban-card-grip"><GripVertical size={14} /></div>
                    <div>
                      <div className="kanban-card-name">{c.name}</div>
                      {c.cnpj && <div className="kanban-card-meta">{c.cnpj}</div>}
                      {c.email && <div className="kanban-card-meta"><Mail size={11} /> {c.email}</div>}
                      <div className="kanban-card-date">{formatDate(c.updated_at)}</div>
                    </div>
                  </div>
                ))}
                {col.length === 0 && (
                  <div className="kanban-empty">Arraste clientes aqui</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
