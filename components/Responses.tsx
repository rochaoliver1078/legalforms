"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Download, Eye, Search, Calendar, Trash2, Check, Clock, Filter, FileText } from "lucide-react";
import { Form, Submission } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface ResponsesProps { form: Form; onBack: () => void; }

type SubStatus = "new" | "read" | "processed";

export default function Responses({ form, onBack }: ResponsesProps) {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selSub, setSelSub] = useState<Submission | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SubStatus>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statuses, setStatuses] = useState<Record<string, SubStatus>>({});
  const [showCharts, setShowCharts] = useState(true);
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch(`/api/submissions?form_id=${form.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setSubs(data); setLoading(false); loadStatuses(data); })
      .catch(() => setLoading(false));
  }, [form.id]);

  const loadStatuses = (submissions: Submission[]) => {
    try { const saved = localStorage.getItem(`lf_status_${form.id}`); if (saved) setStatuses(JSON.parse(saved)); } catch {}
  };

  const setSubStatus = (subId: string, status: SubStatus) => {
    const next = { ...statuses, [subId]: status };
    setStatuses(next);
    try { localStorage.setItem(`lf_status_${form.id}`, JSON.stringify(next)); } catch {}
  };

  // Draw chart
  useEffect(() => {
    if (!chartRef.current || subs.length === 0 || !showCharts) return;
    const loadChart = async () => {
      const { Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, BarController, LineController, Title, Tooltip, Legend, Filler } = await import("chart.js");
      Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, BarController, LineController, Title, Tooltip, Legend, Filler);

      const last30: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        last30[d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })] = 0;
      }
      subs.forEach((s) => {
        const d = new Date(s.submitted_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        if (d in last30) last30[d]++;
      });

      const existing = Chart.getChart(chartRef.current!);
      if (existing) existing.destroy();

      new Chart(chartRef.current!, {
        type: "bar",
        data: {
          labels: Object.keys(last30),
          datasets: [{
            label: "Respostas",
            data: Object.values(last30),
            backgroundColor: "#FF610033",
            borderColor: "#FF6100",
            borderWidth: 2,
            borderRadius: 4,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, title: { display: true, text: "Respostas nos últimos 30 dias", font: { size: 14, weight: "bold" } } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { ticks: { maxRotation: 45, font: { size: 10 } } } },
        }
      });
    };
    loadChart();
  }, [subs, showCharts]);

  const displayFields = form.fields.filter((f) => !["heading", "separator", "page_break", "socios", "alt_events", "lgpd"].includes(f.type)).slice(0, 6);

  // Filters
  const filtered = subs.filter((s) => {
    if (statusFilter !== "all" && (statuses[s.id] || "new") !== statusFilter) return false;
    if (dateFrom && new Date(s.submitted_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(s.submitted_at) > new Date(dateTo + "T23:59:59")) return false;
    if (search && !JSON.stringify(s.data).toLowerCase().includes(search.toLowerCase()) && !(s.submitted_by || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const exportCSV = () => {
    const h = ["Data", "Enviado por", "Status", ...displayFields.map((f) => f.label)];
    const r = filtered.map((s) => [new Date(s.submitted_at).toLocaleString("pt-BR"), s.submitted_by || "—", statuses[s.id] || "new", ...displayFields.map((f) => String(s.data[f.id] || ""))]);
    const csv = [h, ...r].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${form.name}_respostas.csv`; a.click();
  };

  const exportXLSX = async () => {
    const XLSX = await import("xlsx");
    const h = ["Data", "Enviado por", "Status", ...displayFields.map((f) => f.label)];
    const r = filtered.map((s) => [new Date(s.submitted_at).toLocaleString("pt-BR"), s.submitted_by || "—", statuses[s.id] || "new", ...displayFields.map((f) => String(s.data[f.id] || ""))]);
    const ws = XLSX.utils.aoa_to_sheet([h, ...r]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Respostas");
    XLSX.writeFile(wb, `${form.name}_respostas.xlsx`);
  };

  const exportPDF = async (sub: Submission) => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text(form.name, 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Resposta de ${sub.submitted_by || "Anônimo"} — ${new Date(sub.submitted_at).toLocaleString("pt-BR")}`, 14, 28);
    const rows: [string, string][] = [];
    form.fields.forEach((f) => {
      if (["heading", "separator", "page_break", "socios", "alt_events", "lgpd"].includes(f.type)) return;
      const val = sub.data[f.id];
      rows.push([f.label, typeof val === "string" && val.startsWith("http") ? "Arquivo anexado" : Array.isArray(val) ? val.join(", ") : String(val || "—")]);
    });
    // Also include expanded socio/alt data
    Object.entries(sub.data).forEach(([k, val]) => {
      if (!form.fields.find((f) => f.id === k) && k !== "_files" && k !== "_lgpd") {
        rows.push([k, String(val || "—")]);
      }
    });
    autoTable(doc, { startY: 34, head: [["Campo", "Valor"]], body: rows, styles: { fontSize: 10, cellPadding: 4 }, headStyles: { fillColor: [255, 97, 0] } });
    doc.save(`${form.name}_resposta_${sub.submitted_by || "anonimo"}.pdf`);
  };

  const statusLabel = (s: SubStatus) => ({ new: "Novo", read: "Lido", processed: "Processado" }[s]);
  const statusColor = (s: SubStatus) => ({ new: "#3b82f6", read: "#f59e0b", processed: "#10b981" }[s]);

  const countByStatus = (s: SubStatus) => subs.filter((x) => (statuses[x.id] || "new") === s).length;

  if (loading) return <div className="responses-page" style={{ textAlign: "center", padding: 80 }}><div className="spinner" style={{ margin: "0 auto 16px" }} /><div style={{ color: "var(--text-muted)" }}>Carregando...</div></div>;

  return (
    <div className="responses-page">
      {/* Header */}
      <div className="responses-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn--ghost" onClick={onBack}><ArrowLeft size={16} /> Voltar</button>
          <div><h2 style={{ fontSize: 20, fontWeight: 800 }}>{form.name}</h2><div style={{ fontSize: 13, color: "var(--text-muted)" }}>{subs.length} respostas</div></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn--sm btn--ghost" onClick={() => setShowCharts(!showCharts)}>{showCharts ? "Ocultar" : "Mostrar"} gráfico</button>
          <button className="btn btn--sm" onClick={exportCSV}><Download size={14} /> CSV</button>
          <button className="btn btn--sm btn--primary" onClick={exportXLSX}><Download size={14} /> Excel</button>
        </div>
      </div>

      {/* Stats */}
      <div className="responses-stats">
        <div className="stat-card"><div className="stat-card-value">{subs.length}</div><div className="stat-card-label">Total</div></div>
        <div className="stat-card"><div className="stat-card-value" style={{ color: "#3b82f6" }}>{countByStatus("new")}</div><div className="stat-card-label">Novos</div></div>
        <div className="stat-card"><div className="stat-card-value" style={{ color: "#f59e0b" }}>{countByStatus("read")}</div><div className="stat-card-label">Lidos</div></div>
        <div className="stat-card"><div className="stat-card-value" style={{ color: "#10b981" }}>{countByStatus("processed")}</div><div className="stat-card-label">Processados</div></div>
      </div>

      {/* Chart */}
      {showCharts && subs.length > 0 && (
        <div className="chart-container"><canvas ref={chartRef} /></div>
      )}

      {/* Filters */}
      <div className="filter-bar" style={{ marginTop: 16 }}>
        <div className="filter-pills">
          <button className={statusFilter === "all" ? "filter-pill active" : "filter-pill"} onClick={() => setStatusFilter("all")}>Todos</button>
          <button className={statusFilter === "new" ? "filter-pill active" : "filter-pill"} onClick={() => setStatusFilter("new")}>🔵 Novos</button>
          <button className={statusFilter === "read" ? "filter-pill active" : "filter-pill"} onClick={() => setStatusFilter("read")}>🟡 Lidos</button>
          <button className={statusFilter === "processed" ? "filter-pill active" : "filter-pill"} onClick={() => setStatusFilter("processed")}>🟢 Processados</button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="date" className="input input--sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="De" />
          <span style={{ fontSize: 12 }}>→</span>
          <input type="date" className="input input--sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="Até" />
        </div>
        <div className="search-box" style={{ width: 200 }}><Search size={16} /><input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      </div>

      {/* Table */}
      {subs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}><div style={{ fontSize: 40, marginBottom: 12, opacity: .5 }}>📭</div><div style={{ fontWeight: 700 }}>Nenhuma resposta</div></div>
      ) : (
        <div className="responses-table-wrap">
          <table className="responses-table">
            <thead><tr><th>#</th><th>Status</th><th>Data</th><th>Enviado por</th>{displayFields.map((f) => <th key={f.id}>{f.label}</th>)}<th>Ações</th></tr></thead>
            <tbody>
              {filtered.map((s, i) => {
                const st = statuses[s.id] || "new";
                return (
                  <tr key={s.id} className={st === "new" ? "row-new" : ""}>
                    <td style={{ fontWeight: 600 }}>{i + 1}</td>
                    <td>
                      <select className="status-select" value={st} onChange={(e) => setSubStatus(s.id, e.target.value as SubStatus)} style={{ color: statusColor(st), borderColor: statusColor(st) }}>
                        <option value="new">🔵 Novo</option><option value="read">🟡 Lido</option><option value="processed">🟢 Processado</option>
                      </select>
                    </td>
                    <td>{new Date(s.submitted_at).toLocaleDateString("pt-BR")}</td>
                    <td style={{ fontWeight: 600 }}>{s.submitted_by || "—"}</td>
                    {displayFields.map((f) => <td key={f.id}>{String(s.data[f.id] || "—").slice(0, 40)}</td>)}
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn--icon-sm btn--ghost" title="Ver" onClick={() => { setSelSub(s); setSubStatus(s.id, st === "new" ? "read" : st); }}><Eye size={14} /></button>
                        <button className="btn btn--icon-sm btn--ghost" title="PDF" onClick={() => exportPDF(s)}><FileText size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selSub && (
        <div className="modal-backdrop" onClick={() => setSelSub(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>Resposta #{subs.indexOf(selSub) + 1}</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn--sm" onClick={() => exportPDF(selSub)}><FileText size={14} /> PDF</button>
                <button className="btn btn--icon btn--ghost" onClick={() => setSelSub(null)}>✕</button>
              </div>
            </div>
            <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <div style={{ marginBottom: 12, fontSize: 13, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                <span><Calendar size={13} style={{ display: "inline", marginRight: 4 }} />{new Date(selSub.submitted_at).toLocaleString("pt-BR")} · {selSub.submitted_by || "Anônimo"}</span>
                <select className="status-select" value={statuses[selSub.id] || "new"} onChange={(e) => setSubStatus(selSub.id, e.target.value as SubStatus)} style={{ color: statusColor(statuses[selSub.id] || "new") }}>
                  <option value="new">🔵 Novo</option><option value="read">🟡 Lido</option><option value="processed">🟢 Processado</option>
                </select>
              </div>
              {Object.entries(selSub.data).filter(([k]) => k !== "_files" && k !== "_lgpd").map(([key, val]) => {
                const field = form.fields.find((f) => f.id === key);
                return (
                  <div key={key} style={{ marginBottom: 12, padding: 12, background: "var(--bg-page)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>{field?.label || key}</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {typeof val === "string" && val.startsWith("http") ? <a href={val} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>📎 Ver arquivo</a> : Array.isArray(val) ? val.join(", ") : String(val || "—")}
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
