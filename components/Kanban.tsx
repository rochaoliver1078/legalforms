"use client";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ChevronRight, Building2, Phone, Mail, Edit3, GripVertical, Plus, FileText, UserPlus } from "lucide-react";
import { Client, Company, ProcessStatus, PROCESS_STATUS_LABELS, PROCESS_STATUS_COLORS, COMPANY_ROLE_LABELS, CompanyRole } from "@/lib/types";
import type { Form, Submission } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

interface KanbanProps {
  onBack: () => void;
  onSelectClient: (client: Client) => void;
  forms?: Form[];
  onCreateClient?: () => void;
}

const COLUMNS: ProcessStatus[] = ["pending", "docs_received", "analyzing", "filed", "completed"];

export default function Kanban({ onBack, onSelectClient, forms = [], onCreateClient }: KanbanProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then(r => r.json()).catch(() => []),
      fetch("/api/companies").then(r => r.json()).catch(() => []),
      fetch("/api/client-companies").then(r => r.json()).catch(() => []),
      fetch("/api/submissions").then(r => r.json()).catch(() => []),
    ]).then(([c, co, lk, s]) => {
      setClients(Array.isArray(c) ? c : []);
      setCompanies(Array.isArray(co) ? co : []);
      setLinks(Array.isArray(lk) ? lk : []);
      setSubs(Array.isArray(s) ? s : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getClientCompany = (clientId: string) => {
    const link = links.find(l => l.client_id === clientId);
    if (!link) return null;
    const company = companies.find(c => c.id === link.company_id) || (link.companies as Company);
    return company ? { company, role: link.role as CompanyRole } : null;
  };

  const getClientPendingCount = (client: Client) => {
    const respondedFormIds = new Set(
      subs.filter(s => {
        const d = s.data || {};
        if (client.name) {
          const match = Object.values(d).some(v => typeof v === "string" && v.toLowerCase().includes(client.name.toLowerCase()));
          if (match) return true;
        }
        if (s.submitted_by && client.name && s.submitted_by.toLowerCase().includes(client.name.toLowerCase())) return true;
        return false;
      }).map(s => s.form_id)
    );
    return forms.filter(f => !respondedFormIds.has(f.id) && f.status !== "archived").length;
  };

  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    setDragId(clientId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, status: ProcessStatus) => {
    e.preventDefault();
    if (!dragId) return;
    const client = clients.find((c) => c.id === dragId);
    if (!client || client.process_status === status) { setDragId(null); return; }
    setClients((p) => p.map((c) => (c.id === dragId ? { ...c, process_status: status } : c)));
    setDragId(null);
    await fetch("/api/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: dragId, process_status: status }) });
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };

  const totalClients = clients.length;

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
        {onCreateClient && (
          <button className="btn btn--primary btn--sm" onClick={onCreateClient}>
            <UserPlus size={14} /> Novo Cliente
          </button>
        )}
      </div>

      <div className="kanban-board">
        {COLUMNS.map((status) => {
          const col = clients.filter((c) => c.process_status === status);
          const pct = totalClients > 0 ? Math.round((col.length / totalClients) * 100) : 0;
          return (
            <div key={status} className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}>
              <div className="kanban-column-header" style={{ borderTopColor: PROCESS_STATUS_COLORS[status] }}>
                <span className="kanban-column-dot" style={{ background: PROCESS_STATUS_COLORS[status] }} />
                <span className="kanban-column-title">{PROCESS_STATUS_LABELS[status]}</span>
                <span className="kanban-column-count">{col.length}</span>
                {totalClients > 0 && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>{pct}%</span>}
              </div>
              <div className="kanban-column-body">
                {col.map((c) => {
                  const compInfo = getClientCompany(c.id);
                  const pendingCount = forms.length > 0 ? getClientPendingCount(c) : 0;
                  return (
                    <div key={c.id} className={cn("kanban-card", dragId === c.id && "dragging")}
                      draggable onDragStart={(e) => handleDragStart(e, c.id)}
                      onClick={() => onSelectClient(c)}>
                      <div className="kanban-card-grip"><GripVertical size={14} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="kanban-card-name">{c.name}</div>
                        {c.cpf && <div className="kanban-card-meta">{c.cpf}</div>}
                        {compInfo && (
                          <div className="kanban-card-meta" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Building2 size={11} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {compInfo.company.razao_social?.length > 25 ? compInfo.company.razao_social.slice(0, 25) + "…" : compInfo.company.razao_social}
                            </span>
                            <span style={{ fontSize: 10, opacity: .7 }}>({COMPANY_ROLE_LABELS[compInfo.role] || compInfo.role})</span>
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <div className="kanban-card-date">{formatDate(c.updated_at)}</div>
                          {pendingCount > 0 && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, background: "#fef2f2", color: "#dc2626",
                              padding: "1px 6px", borderRadius: "var(--radius-full)", display: "inline-flex", alignItems: "center", gap: 3,
                            }}>
                              <FileText size={9} /> {pendingCount} pend.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
