"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, Download, Eye, Search, Calendar, Trash2 } from "lucide-react";
import { Form, Submission } from "@/lib/types";
import { FIELD_TYPES } from "@/lib/field-definitions";
import { formatDate } from "@/lib/utils";

interface ResponsesProps {
  form: Form;
  onBack: () => void;
}

export default function Responses({ form, onBack }: ResponsesProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch(`/api/submissions?form_id=${form.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setSubmissions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [form.id]);

  // Get displayable fields (not headings/separators/smart)
  const displayFields = form.fields.filter(
    (f) => !["heading", "separator", "socios", "alt_events"].includes(f.type)
  ).slice(0, 6); // Show max 6 columns

  const exportCSV = () => {
    const headers = ["Data", "Enviado por", ...displayFields.map((f) => f.label)];
    const rows = submissions.map((s) => [
      new Date(s.submitted_at).toLocaleString("pt-BR"),
      s.submitted_by || "—",
      ...displayFields.map((f) => String(s.data[f.id] || "")),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.name}_respostas.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLSX = async () => {
    const XLSX = await import("xlsx");
    const headers = ["Data", "Enviado por", ...displayFields.map((f) => f.label)];
    const rows = submissions.map((s) => [
      new Date(s.submitted_at).toLocaleString("pt-BR"),
      s.submitted_by || "—",
      ...displayFields.map((f) => String(s.data[f.id] || "")),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Respostas");
    XLSX.writeFile(wb, `${form.name}_respostas.xlsx`);
  };

  const filtered = searchTerm
    ? submissions.filter((s) =>
        JSON.stringify(s.data).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.submitted_by || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    : submissions;

  if (loading) {
    return (
      <div className="responses-page" style={{ textAlign: "center", padding: 80 }}>
        <div className="spinner" style={{ margin: "0 auto 16px" }} />
        <div style={{ color: "var(--text-muted)" }}>Carregando respostas...</div>
      </div>
    );
  }

  return (
    <div className="responses-page">
      {/* Header */}
      <div className="responses-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn--ghost" onClick={onBack}><ArrowLeft size={16} /> Voltar</button>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Respostas: {form.name}</h2>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{submissions.length} respostas recebidas</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="search-box" style={{ width: 220 }}>
            <Search size={16} />
            <input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn btn--sm" onClick={exportCSV}><Download size={14} /> CSV</button>
          <button className="btn btn--sm btn--primary" onClick={exportXLSX}><Download size={14} /> Excel</button>
        </div>
      </div>

      {/* Stats */}
      <div className="responses-stats">
        <div className="stat-card">
          <div className="stat-card-value">{submissions.length}</div>
          <div className="stat-card-label">Total de respostas</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">
            {submissions.filter((s) => {
              const d = new Date(s.submitted_at);
              const now = new Date();
              return d.getTime() > now.getTime() - 7 * 86400000;
            }).length}
          </div>
          <div className="stat-card-label">Últimos 7 dias</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">
            {submissions.length > 0 ? formatDate(submissions[0].submitted_at) : "—"}
          </div>
          <div className="stat-card-label">Última resposta</div>
        </div>
      </div>

      {/* Table */}
      {submissions.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: .5 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Nenhuma resposta ainda</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Compartilhe o formulário para começar a receber respostas</div>
        </div>
      ) : (
        <div className="responses-table-wrap">
          <table className="responses-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Enviado por</th>
                {displayFields.map((f) => <th key={f.id}>{f.label}</th>)}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>{i + 1}</td>
                  <td>{new Date(s.submitted_at).toLocaleDateString("pt-BR")}</td>
                  <td style={{ fontWeight: 600 }}>{s.submitted_by || "—"}</td>
                  {displayFields.map((f) => (
                    <td key={f.id}>{String(s.data[f.id] || "—")}</td>
                  ))}
                  <td>
                    <button className="btn btn--icon-sm btn--ghost" title="Ver detalhes" onClick={() => setSelectedSub(s)}>
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSub && (
        <div className="modal-backdrop" onClick={() => setSelectedSub(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>Resposta #{submissions.indexOf(selectedSub) + 1}</h3>
              <button className="btn btn--icon btn--ghost" onClick={() => setSelectedSub(null)}><span style={{ fontSize: 18 }}>✕</span></button>
            </div>
            <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <div style={{ marginBottom: 12, fontSize: 13, color: "var(--text-muted)" }}>
                <Calendar size={13} style={{ display: "inline", marginRight: 4 }} />
                {new Date(selectedSub.submitted_at).toLocaleString("pt-BR")} · por {selectedSub.submitted_by || "Anônimo"}
              </div>
              {Object.entries(selectedSub.data).filter(([k]) => k !== "_files").map(([key, val]) => {
                const field = form.fields.find((f) => f.id === key);
                return (
                  <div key={key} style={{ marginBottom: 12, padding: 12, background: "var(--bg-page)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>
                      {field?.label || key}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {typeof val === "string" && val.startsWith("http") ? (
                        <a href={val} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>📎 Ver arquivo</a>
                      ) : Array.isArray(val) ? val.join(", ") : String(val || "—")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
