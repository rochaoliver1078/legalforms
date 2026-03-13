"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowLeft, Plus, Search, Edit3, Trash2, Users, Building2, Phone, Mail,
  ChevronRight, FileText, Eye, Clock, Check, X, Filter, MapPin, Loader2,
  AlertCircle, CheckCircle2, Link2, Unlink, UserPlus, BriefcaseBusiness, Send
} from "lucide-react";
import {
  Client, Company, ClientCompany, CompanyRole,
  Form, Submission, ProcessStatus,
  PROCESS_STATUS_LABELS, PROCESS_STATUS_COLORS, COMPANY_ROLE_LABELS
} from "@/lib/types";
import { maskCNPJ, maskCPF, maskPhone, maskCEP, formatDate, cn } from "@/lib/utils";
import { fetchCNPJ, fetchCEP } from "@/lib/field-definitions";

interface ClientsProps {
  onBack: () => void;
  forms: Form[];
  onViewForm: (id: string) => void;
}

type LookupStatus = "idle" | "loading" | "success" | "error";
type Tab = "clients" | "companies";

const EMPTY_CLIENT: Partial<Client> = {
  name: "", email: "", cpf: "", phone: "", contact_name: "", notes: "",
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "",
  process_status: "pending",
};

const EMPTY_COMPANY: Partial<Company> = {
  razao_social: "", nome_fantasia: "", cnpj: "", cnae_fiscal: "", situacao_cadastral: "",
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "",
};

export default function Clients({ onBack, forms, onViewForm }: ClientsProps) {
  const [tab, setTab] = useState<Tab>("clients");
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selClient, setSelClient] = useState<Client | null>(null);
  const [selCompany, setSelCompany] = useState<Company | null>(null);
  // Client form
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientData, setClientData] = useState<Partial<Client>>({ ...EMPTY_CLIENT });
  const [editClientId, setEditClientId] = useState<string | null>(null);
  // Company form
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [companyData, setCompanyData] = useState<Partial<Company>>({ ...EMPTY_COMPANY });
  const [editCompanyId, setEditCompanyId] = useState<string | null>(null);
  // Link modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkRole, setLinkRole] = useState<CompanyRole>("responsavel");
  const [linkSearch, setLinkSearch] = useState("");
  // Filters
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | "all">("all");
  // Lookups
  const [cnpjStatus, setCnpjStatus] = useState<LookupStatus>("idle");
  const [cepStatus, setCepStatus] = useState<LookupStatus>("idle");
  const [clientCepStatus, setClientCepStatus] = useState<LookupStatus>("idle");

  // ── Load data ───────────────────────────────────────────────────
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

  // ── CNPJ auto-fill (for company) ───────────────────────────────
  const handleCnpjChange = useCallback(async (raw: string) => {
    const masked = maskCNPJ(raw);
    setCompanyData(p => ({ ...p, cnpj: masked }));
    const clean = masked.replace(/\D/g, "");
    if (clean.length !== 14) { setCnpjStatus("idle"); return; }
    setCnpjStatus("loading");
    const result = await fetchCNPJ(clean);
    if (result) {
      setCnpjStatus("success");
      setCompanyData(p => ({
        ...p,
        razao_social: result.razao_social || p.razao_social,
        nome_fantasia: result.nome_fantasia || "",
        cnae_fiscal: result.cnae_fiscal || "",
        situacao_cadastral: result.situacao || "",
        cep: result.cep ? maskCEP(result.cep) : p.cep,
        logradouro: result.logradouro || p.logradouro,
        numero: result.numero || p.numero,
        bairro: result.bairro || p.bairro,
        cidade: result.municipio || p.cidade,
        uf: result.uf || p.uf,
      }));
    } else { setCnpjStatus("error"); }
  }, []);

  // ── CEP auto-fill (for company) ────────────────────────────────
  const handleCompanyCepChange = useCallback(async (raw: string) => {
    const masked = maskCEP(raw);
    setCompanyData(p => ({ ...p, cep: masked }));
    const clean = masked.replace(/\D/g, "");
    if (clean.length !== 8) { setCepStatus("idle"); return; }
    setCepStatus("loading");
    const result = await fetchCEP(clean);
    if (result) {
      setCepStatus("success");
      setCompanyData(p => ({ ...p, logradouro: result.logradouro || p.logradouro, bairro: result.bairro || p.bairro, cidade: result.cidade || p.cidade, uf: result.uf || p.uf }));
    } else { setCepStatus("error"); }
  }, []);

  // ── CEP auto-fill (for client personal address) ────────────────
  const handleClientCepChange = useCallback(async (raw: string) => {
    const masked = maskCEP(raw);
    setClientData(p => ({ ...p, cep: masked }));
    const clean = masked.replace(/\D/g, "");
    if (clean.length !== 8) { setClientCepStatus("idle"); return; }
    setClientCepStatus("loading");
    const result = await fetchCEP(clean);
    if (result) {
      setClientCepStatus("success");
      setClientData(p => ({ ...p, logradouro: result.logradouro || p.logradouro, bairro: result.bairro || p.bairro, cidade: result.cidade || p.cidade, uf: result.uf || p.uf }));
    } else { setClientCepStatus("error"); }
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────
  const getClientCompanies = (clientId: string) =>
    links.filter(l => l.client_id === clientId).map(l => ({
      link: l,
      company: companies.find(c => c.id === l.company_id) || (l.companies as Company),
    })).filter(x => x.company);

  const getCompanyClients = (companyId: string) =>
    links.filter(l => l.company_id === companyId).map(l => ({
      link: l,
      client: clients.find(c => c.id === l.client_id) || (l.clients as Client),
    })).filter(x => x.client);

  const getClientSubs = (client: Client): Submission[] => {
    return subs.filter(s => {
      const d = s.data || {};
      if (client.name) {
        const match = Object.values(d).some(v => typeof v === "string" && v.toLowerCase().includes(client.name.toLowerCase()));
        if (match) return true;
      }
      if (s.submitted_by && client.name && s.submitted_by.toLowerCase().includes(client.name.toLowerCase())) return true;
      return false;
    });
  };

  const getClientForms = (client: Client) => {
    const clientSubs = getClientSubs(client);
    const formIds = Array.from(new Set(clientSubs.map(s => s.form_id)));
    return formIds.map(fid => {
      const form = forms.find(f => f.id === fid);
      const count = clientSubs.filter(s => s.form_id === fid).length;
      return { form, count, latestSub: clientSubs.filter(s => s.form_id === fid).sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0] };
    }).filter(x => x.form);
  };

  const getPendingForms = (client: Client) => {
    const respondedIds = new Set(getClientSubs(client).map(s => s.form_id));
    return forms.filter(f => !respondedIds.has(f.id) && f.status !== "archived");
  };

  const formatAddress = (obj: any) => {
    const parts = [obj.logradouro, obj.numero, obj.complemento, obj.bairro].filter(Boolean);
    const city = [obj.cidade, obj.uf].filter(Boolean).join("-");
    return [parts.join(", "), city, obj.cep].filter(Boolean).join(" · ");
  };

  // ── Filtered lists ───────────────────────────────────────────────
  const filteredClients = useMemo(() => {
    let list = clients;
    if (statusFilter !== "all") list = list.filter(c => c.process_status === statusFilter);
    if (search) list = list.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.cpf || "").includes(search) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [clients, search, statusFilter]);

  const filteredCompanies = useMemo(() => {
    if (!search) return companies;
    return companies.filter(c =>
      c.razao_social.toLowerCase().includes(search.toLowerCase()) ||
      (c.cnpj || "").includes(search) ||
      (c.nome_fantasia || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [companies, search]);

  // ── CRUD: Client ─────────────────────────────────────────────────
  const resetClientForm = () => { setClientData({ ...EMPTY_CLIENT }); setClientCepStatus("idle"); };

  const handleSaveClient = async () => {
    if (!clientData.name?.trim()) return;
    if (editClientId) {
      const r = await fetch("/api/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editClientId, ...clientData }) });
      if (r.ok) { const u = await r.json(); setClients(p => p.map(c => c.id === editClientId ? u : c)); if (selClient?.id === editClientId) setSelClient(u); }
    } else {
      const r = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(clientData) });
      if (r.ok) { const c = await r.json(); setClients(p => [c, ...p]); }
    }
    setShowClientForm(false); setEditClientId(null); resetClientForm();
  };

  const handleEditClient = (c: Client) => {
    setClientData({ name: c.name, email: c.email, cpf: c.cpf, phone: c.phone, contact_name: c.contact_name, notes: c.notes, cep: c.cep, logradouro: c.logradouro, numero: c.numero, complemento: c.complemento, bairro: c.bairro, cidade: c.cidade, uf: c.uf, process_status: c.process_status });
    setEditClientId(c.id); setClientCepStatus("idle"); setShowClientForm(true);
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Excluir este cliente?")) return;
    await fetch(`/api/clients?id=${id}`, { method: "DELETE" });
    setClients(p => p.filter(c => c.id !== id));
    if (selClient?.id === id) setSelClient(null);
  };

  // ── CRUD: Company ────────────────────────────────────────────────
  const resetCompanyForm = () => { setCompanyData({ ...EMPTY_COMPANY }); setCnpjStatus("idle"); setCepStatus("idle"); };

  const handleSaveCompany = async () => {
    if (!companyData.razao_social?.trim() && !companyData.cnpj?.trim()) return;
    if (editCompanyId) {
      const r = await fetch("/api/companies", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editCompanyId, ...companyData }) });
      if (r.ok) { const u = await r.json(); setCompanies(p => p.map(c => c.id === editCompanyId ? u : c)); if (selCompany?.id === editCompanyId) setSelCompany(u); }
    } else {
      const r = await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(companyData) });
      if (r.ok) { const c = await r.json(); setCompanies(p => [c, ...p]); }
    }
    setShowCompanyForm(false); setEditCompanyId(null); resetCompanyForm();
  };

  const handleEditCompany = (c: Company) => {
    setCompanyData({ razao_social: c.razao_social, nome_fantasia: c.nome_fantasia, cnpj: c.cnpj, cnae_fiscal: c.cnae_fiscal, situacao_cadastral: c.situacao_cadastral, cep: c.cep, logradouro: c.logradouro, numero: c.numero, complemento: c.complemento, bairro: c.bairro, cidade: c.cidade, uf: c.uf });
    setEditCompanyId(c.id); setCnpjStatus("idle"); setCepStatus("idle"); setShowCompanyForm(true);
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm("Excluir esta empresa?")) return;
    await fetch(`/api/companies?id=${id}`, { method: "DELETE" });
    setCompanies(p => p.filter(c => c.id !== id));
    if (selCompany?.id === id) setSelCompany(null);
  };

  // ── Linking ──────────────────────────────────────────────────────
  const handleLink = async (companyId: string) => {
    if (!selClient) return;
    const r = await fetch("/api/client-companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: selClient.id, company_id: companyId, role: linkRole }) });
    if (r.ok) { const lk = await r.json(); setLinks(p => [...p, lk]); }
    setShowLinkModal(false); setLinkSearch(""); setLinkRole("responsavel");
  };

  const handleUnlink = async (linkId: string) => {
    if (!confirm("Desvincular?")) return;
    await fetch(`/api/client-companies?id=${linkId}`, { method: "DELETE" });
    setLinks(p => p.filter(l => l.id !== linkId));
  };

  const updateStatus = async (client: Client, status: ProcessStatus) => {
    const r = await fetch("/api/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: client.id, process_status: status }) });
    if (r.ok) { const u = await r.json(); setClients(p => p.map(c => c.id === client.id ? u : c)); if (selClient?.id === client.id) setSelClient(u); }
  };

  const statusOptions: ProcessStatus[] = ["pending", "docs_received", "analyzing", "filed", "completed"];
  const roleOptions: CompanyRole[] = ["socio", "contador", "responsavel", "outro"];

  // ── Status badge component ───────────────────────────────────────
  const StatusBadge = ({ status }: { status: LookupStatus }) => (
    <>
      {status === "loading" && <span className="input-status input-status--loading"><Loader2 size={14} className="spin" /> Buscando...</span>}
      {status === "success" && <span className="input-status input-status--success"><CheckCircle2 size={14} /> Encontrado</span>}
      {status === "error" && <span className="input-status input-status--error"><AlertCircle size={14} /> Não encontrado</span>}
    </>
  );

  // ═══════════════════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════════════════
  if (loading) return (
    <div className="clients-page">
      <div className="clients-header"><div className="skeleton" style={{ width: 200, height: 28 }} /></div>
      <div className="clients-grid">{[1, 2, 3, 4].map(i => <div key={i} className="client-card skeleton-card"><div className="skeleton" style={{ width: "70%", height: 16 }} /><div className="skeleton" style={{ width: "50%", height: 12, marginTop: 8 }} /></div>)}</div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════
  // COMPANY DETAIL
  // ═══════════════════════════════════════════════════════════════════
  if (selCompany) {
    const compClients = getCompanyClients(selCompany.id);
    const addr = formatAddress(selCompany);
    return (
      <div className="clients-page">
        <div className="clients-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn--ghost" onClick={() => setSelCompany(null)}><ArrowLeft size={16} /> Voltar</button>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{selCompany.razao_social}</h2>
              {selCompany.nome_fantasia && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{selCompany.nome_fantasia}</div>}
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>CNPJ: {selCompany.cnpj}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--sm" onClick={() => handleEditCompany(selCompany)}><Edit3 size={14} /> Editar</button>
            <button className="btn btn--sm" style={{ color: "var(--danger)" }} onClick={() => handleDeleteCompany(selCompany.id)}><Trash2 size={14} /></button>
          </div>
        </div>

        <div className="client-info-grid">
          {selCompany.cnae_fiscal && <div className="client-info-item"><Building2 size={14} /> CNAE: {selCompany.cnae_fiscal}</div>}
          {selCompany.situacao_cadastral && <div className="client-info-item"><CheckCircle2 size={14} /> {selCompany.situacao_cadastral}</div>}
          {addr && <div className="client-info-item" style={{ gridColumn: "1/-1" }}><MapPin size={14} /> {addr}</div>}
        </div>

        {/* Linked Clients */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>👥 Pessoas vinculadas ({compClients.length})</h3>
          {compClients.length === 0 ? <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Nenhuma pessoa vinculada.</div> : (
            <div className="client-forms-list">
              {compClients.map(({ link, client }) => (
                <div key={link.id} className="client-form-item" onClick={() => { setSelCompany(null); setSelClient(client); }}>
                  <div className="client-form-icon" style={{ background: "#eff6ff", color: "#3b82f6" }}><Users size={18} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{client.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{client.cpf || client.email} · {COMPANY_ROLE_LABELS[link.role as CompanyRole] || link.role}</div>
                  </div>
                  <button className="btn btn--icon-sm btn--ghost" style={{ color: "var(--danger)" }} onClick={(e) => { e.stopPropagation(); handleUnlink(link.id); }}><Unlink size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // CLIENT DETAIL
  // ═══════════════════════════════════════════════════════════════════
  if (selClient) {
    const clientComps = getClientCompanies(selClient.id);
    const clientForms = getClientForms(selClient);
    const pending = getPendingForms(selClient);
    const addr = formatAddress(selClient);

    return (
      <div className="clients-page">
        <div className="clients-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn--ghost" onClick={() => setSelClient(null)}><ArrowLeft size={16} /> Voltar</button>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{selClient.name}</h2>
              {selClient.cpf && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>CPF: {selClient.cpf}</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--sm" onClick={() => handleEditClient(selClient)}><Edit3 size={14} /> Editar</button>
            <button className="btn btn--sm" style={{ color: "var(--danger)" }} onClick={() => handleDeleteClient(selClient.id)}><Trash2 size={14} /></button>
          </div>
        </div>

        {/* Status */}
        <div className="client-status-bar">
          {statusOptions.map(s => (
            <button key={s} className={cn("client-status-step", selClient.process_status === s && "active")}
              style={{ borderColor: selClient.process_status === s ? PROCESS_STATUS_COLORS[s] : undefined, background: selClient.process_status === s ? PROCESS_STATUS_COLORS[s] + "18" : undefined }}
              onClick={() => updateStatus(selClient, s)}>
              <div className="client-status-dot" style={{ background: PROCESS_STATUS_COLORS[s] }} />
              {PROCESS_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="client-info-grid">
          {selClient.email && <div className="client-info-item"><Mail size={14} /> {selClient.email}</div>}
          {selClient.phone && <div className="client-info-item"><Phone size={14} /> {selClient.phone}</div>}
          {selClient.contact_name && <div className="client-info-item"><Users size={14} /> {selClient.contact_name}</div>}
          {addr && <div className="client-info-item" style={{ gridColumn: "1/-1" }}><MapPin size={14} /> {addr}</div>}
          {selClient.notes && <div className="client-info-item" style={{ gridColumn: "1/-1" }}><FileText size={14} /> {selClient.notes}</div>}
        </div>

        {/* Linked Companies */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800 }}>🏢 Empresas vinculadas ({clientComps.length})</h3>
            <button className="btn btn--sm btn--primary" onClick={() => { setShowLinkModal(true); setLinkSearch(""); }}><Link2 size={14} /> Vincular empresa</button>
          </div>
          {clientComps.length === 0 ? <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "16px 0" }}>Nenhuma empresa vinculada. Clique em "Vincular empresa" para associar.</div> : (
            <div className="client-forms-list">
              {clientComps.map(({ link, company }) => (
                <div key={link.id} className="client-form-item" onClick={() => { setSelClient(null); setSelCompany(company); }}>
                  <div className="client-form-icon" style={{ background: "#f0fdf4", color: "#10b981" }}><Building2 size={18} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{company.razao_social}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{company.cnpj} · {COMPANY_ROLE_LABELS[link.role as CompanyRole] || link.role}</div>
                  </div>
                  <button className="btn btn--icon-sm btn--ghost" style={{ color: "var(--danger)" }} onClick={(e) => { e.stopPropagation(); handleUnlink(link.id); }}><Unlink size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Responded Forms */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>📋 Formulários respondidos ({clientForms.length})</h3>
          {clientForms.length === 0 ? <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Nenhuma resposta vinculada.</div> : (
            <div className="client-forms-list">
              {clientForms.map(({ form, count, latestSub }) => (
                <div key={form!.id} className="client-form-item" onClick={() => onViewForm(form!.id)}>
                  <div className="client-form-icon" style={{ background: form!.color + "18", color: form!.color }}>{form!.icon}</div>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{form!.name}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{count} resp. · {formatDate(latestSub.submitted_at)}</div></div>
                  <div className="client-form-badge"><Check size={14} /> Respondido</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pending.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>⏳ Pendentes ({pending.length})</h3>
            <div className="client-forms-list">
              {pending.map(f => {
                const appUrl = typeof window !== "undefined" ? window.location.origin : "";
                const formLink = `${appUrl}/f/${f.id}`;
                return (
                  <div key={f.id} className="client-form-item client-form-item--pending">
                    <div className="client-form-icon" style={{ background: "#fef2f2", color: "#dc2626" }} onClick={() => onViewForm(f.id)}>{f.icon}</div>
                    <div style={{ flex: 1 }} onClick={() => onViewForm(f.id)}><div style={{ fontWeight: 700 }}>{f.name}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Não preenchido</div></div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      {selClient.phone && (
                        <button className="reminder-btn" title="Enviar lembrete via WhatsApp" onClick={(e) => {
                          e.stopPropagation();
                          const phone = (selClient.phone || "").replace(/\D/g, "");
                          const msg = encodeURIComponent(`Olá ${selClient.name}! Você tem um formulário pendente:\n📋 *${f.name}*\n🔗 ${formLink}\nPreencha quando puder. Obrigado!`);
                          window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
                        }}>
                          <Send size={11} /> WhatsApp
                        </button>
                      )}
                      {selClient.email && (
                        <button className="reminder-btn" title="Enviar lembrete via e-mail" onClick={(e) => {
                          e.stopPropagation();
                          const subject = encodeURIComponent(`Lembrete: ${f.name}`);
                          const body = encodeURIComponent(`Olá ${selClient.name}!\n\nVocê tem um formulário pendente:\n📋 ${f.name}\n🔗 ${formLink}\n\nPreencha quando puder. Obrigado!`);
                          window.open(`mailto:${selClient.email}?subject=${subject}&body=${body}`, "_blank");
                        }}>
                          <Mail size={11} /> E-mail
                        </button>
                      )}
                      <div className="client-form-badge client-form-badge--pending"><Clock size={14} /> Pendente</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>🕐 Timeline</h3>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-dot" style={{ background: PROCESS_STATUS_COLORS[selClient.process_status] }} />
              <div className="timeline-content"><div style={{ fontWeight: 700 }}>Status: {PROCESS_STATUS_LABELS[selClient.process_status]}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(selClient.updated_at)}</div></div>
            </div>
            {getClientSubs(selClient).sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()).slice(0, 10).map(s => {
              const form = forms.find(f => f.id === s.form_id);
              return (<div key={s.id} className="timeline-item"><div className="timeline-dot" style={{ background: "#3b82f6" }} /><div className="timeline-content"><div style={{ fontWeight: 700 }}>Respondeu: {form?.name || "Formulário"}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>por {s.submitted_by || "Anônimo"} · {formatDate(s.submitted_at)}</div></div></div>);
            })}
            <div className="timeline-item"><div className="timeline-dot" style={{ background: "#10b981" }} /><div className="timeline-content"><div style={{ fontWeight: 700 }}>Cliente cadastrado</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(selClient.created_at)}</div></div></div>
          </div>
        </div>

        {/* ── Link Company Modal ──────────────────────────────────── */}
        {showLinkModal && (
          <div className="modal-backdrop" onClick={() => setShowLinkModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <div className="modal-header">
                <h3>Vincular Empresa</h3>
                <button className="btn btn--icon btn--ghost" onClick={() => setShowLinkModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Papel do cliente nesta empresa</label>
                  <select className="input" value={linkRole} onChange={e => setLinkRole(e.target.value as CompanyRole)}>
                    {roleOptions.map(r => <option key={r} value={r}>{COMPANY_ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Buscar empresa</label>
                  <div className="search-box" style={{ width: "100%" }}><Search size={16} /><input placeholder="CNPJ ou razão social..." value={linkSearch} onChange={e => setLinkSearch(e.target.value)} /></div>
                </div>
                <div style={{ maxHeight: 250, overflowY: "auto" }}>
                  {companies.filter(c => {
                    // Exclude already linked
                    const linkedIds = new Set(links.filter(l => l.client_id === selClient.id).map(l => l.company_id));
                    if (linkedIds.has(c.id)) return false;
                    if (!linkSearch) return true;
                    return c.razao_social.toLowerCase().includes(linkSearch.toLowerCase()) || c.cnpj.includes(linkSearch);
                  }).map(c => (
                    <div key={c.id} className="client-form-item" style={{ cursor: "pointer" }} onClick={() => handleLink(c.id)}>
                      <div className="client-form-icon" style={{ background: "#f0fdf4", color: "#10b981" }}><Building2 size={16} /></div>
                      <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{c.razao_social}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.cnpj}</div></div>
                      <Link2 size={14} style={{ color: "var(--primary)" }} />
                    </div>
                  ))}
                  {companies.length === 0 && <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 13 }}>Nenhuma empresa cadastrada.</div>}
                </div>
                <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 12, marginTop: 12 }}>
                  <button className="btn btn--sm btn--primary btn--block" onClick={() => { setShowLinkModal(false); setShowCompanyForm(true); }}>
                    <Plus size={14} /> Cadastrar nova empresa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // MAIN LIST (Clients + Companies tabs)
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="clients-page">
      {/* Header */}
      <div className="clients-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn--ghost" onClick={onBack}><ArrowLeft size={16} /></button>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>
            {tab === "clients" ? <><Users size={22} style={{ display: "inline", marginRight: 6 }} /> Clientes</> : <><Building2 size={22} style={{ display: "inline", marginRight: 6 }} /> Empresas</>}
          </h2>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>({tab === "clients" ? clients.length : companies.length})</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="search-box" style={{ width: 220 }}><Search size={16} /><input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          {tab === "clients" ? (
            <button className="btn btn--primary" onClick={() => { setShowClientForm(true); setEditClientId(null); resetClientForm(); }}><UserPlus size={16} /> Novo Cliente</button>
          ) : (
            <button className="btn btn--primary" onClick={() => { setShowCompanyForm(true); setEditCompanyId(null); resetCompanyForm(); }}><Plus size={16} /> Nova Empresa</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-bar">
        <div className="filter-pills">
          <button className={cn("filter-pill", tab === "clients" && "active")} onClick={() => setTab("clients")} style={{ fontWeight: 700 }}><Users size={13} /> Clientes ({clients.length})</button>
          <button className={cn("filter-pill", tab === "companies" && "active")} onClick={() => setTab("companies")} style={{ fontWeight: 700 }}><Building2 size={13} /> Empresas ({companies.length})</button>
        </div>
        {tab === "clients" && (
          <div className="filter-pills">
            {statusOptions.map(s => (
              <button key={s} className={cn("filter-pill", statusFilter === s && "active")} onClick={() => setStatusFilter(statusFilter === s ? "all" : s)} style={{ borderColor: statusFilter === s ? PROCESS_STATUS_COLORS[s] : undefined }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: PROCESS_STATUS_COLORS[s], display: "inline-block" }} /> {PROCESS_STATUS_LABELS[s]} ({clients.filter(c => c.process_status === s).length})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── CLIENTS TAB ───────────────────────────────────────────── */}
      {tab === "clients" && (
        <div className="clients-grid">
          {filteredClients.map(c => {
            const numComps = getClientCompanies(c.id).length;
            const addr = formatAddress(c);
            return (
              <div key={c.id} className="client-card" onClick={() => setSelClient(c)}>
                <div className="client-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn btn--icon-sm btn--ghost" onClick={() => handleEditClient(c)}><Edit3 size={14} /></button>
                  <button className="btn btn--icon-sm btn--ghost" style={{ color: "var(--danger)" }} onClick={() => handleDeleteClient(c.id)}><Trash2 size={14} /></button>
                </div>
                <div className="client-card-avatar" style={{ background: PROCESS_STATUS_COLORS[c.process_status] + "20", color: PROCESS_STATUS_COLORS[c.process_status] }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="client-card-name">{c.name}</div>
                {c.cpf && <div className="client-card-meta">CPF: {c.cpf}</div>}
                {c.email && <div className="client-card-meta"><Mail size={11} /> {c.email}</div>}
                {addr && <div className="client-card-meta"><MapPin size={11} /> {addr.length > 40 ? addr.slice(0, 40) + "..." : addr}</div>}
                <div className="client-card-bottom">
                  <span className="client-status-badge" style={{ background: PROCESS_STATUS_COLORS[c.process_status] + "18", color: PROCESS_STATUS_COLORS[c.process_status], borderColor: PROCESS_STATUS_COLORS[c.process_status] }}>
                    {PROCESS_STATUS_LABELS[c.process_status]}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{numComps} empresa{numComps !== 1 ? "s" : ""}</span>
                </div>
              </div>
            );
          })}
          {filteredClients.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: .5 }}>👤</div>
              <div style={{ fontWeight: 700 }}>Nenhum cliente encontrado</div>
              <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => setShowClientForm(true)}>Cadastrar</button>
            </div>
          )}
        </div>
      )}

      {/* ── COMPANIES TAB ─────────────────────────────────────────── */}
      {tab === "companies" && (
        <div className="clients-grid">
          {filteredCompanies.map(c => {
            const numClients = getCompanyClients(c.id).length;
            return (
              <div key={c.id} className="client-card" onClick={() => setSelCompany(c)}>
                <div className="client-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn btn--icon-sm btn--ghost" onClick={() => handleEditCompany(c)}><Edit3 size={14} /></button>
                  <button className="btn btn--icon-sm btn--ghost" style={{ color: "var(--danger)" }} onClick={() => handleDeleteCompany(c.id)}><Trash2 size={14} /></button>
                </div>
                <div className="client-card-avatar" style={{ background: "#f0fdf418", color: "#10b981" }}>
                  <Building2 size={20} />
                </div>
                <div className="client-card-name">{c.razao_social}</div>
                {c.nome_fantasia && <div className="client-card-meta" style={{ fontStyle: "italic" }}>{c.nome_fantasia}</div>}
                <div className="client-card-meta">{c.cnpj}</div>
                {c.situacao_cadastral && <div className="client-card-meta"><CheckCircle2 size={11} /> {c.situacao_cadastral}</div>}
                <div className="client-card-bottom">
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}><Users size={12} style={{ display: "inline", marginRight: 4 }} />{numClients} pessoa{numClients !== 1 ? "s" : ""}</span>
                </div>
              </div>
            );
          })}
          {filteredCompanies.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: .5 }}>🏢</div>
              <div style={{ fontWeight: 700 }}>Nenhuma empresa encontrada</div>
              <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => setShowCompanyForm(true)}>Cadastrar</button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         CLIENT FORM MODAL
         ═══════════════════════════════════════════════════════════════ */}
      {showClientForm && (
        <div className="modal-backdrop" onClick={() => { setShowClientForm(false); resetClientForm(); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{editClientId ? "Editar Cliente" : "Novo Cliente"}</h3>
              <button className="btn btn--icon btn--ghost" onClick={() => { setShowClientForm(false); resetClientForm(); }}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {/* Dados Pessoais */}
              <div className="modal-section">
                <div className="modal-section-title"><Users size={15} /> Dados Pessoais</div>
                <div className="form-group"><label className="form-label">Nome completo *</label><input className="input" value={clientData.name || ""} onChange={e => setClientData(p => ({ ...p, name: e.target.value }))} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group"><label className="form-label">CPF</label><input className="input" value={clientData.cpf || ""} onChange={e => setClientData(p => ({ ...p, cpf: maskCPF(e.target.value) }))} placeholder="000.000.000-00" /></div>
                  <div className="form-group"><label className="form-label">Telefone</label><input className="input" value={clientData.phone || ""} onChange={e => setClientData(p => ({ ...p, phone: maskPhone(e.target.value) }))} /></div>
                </div>
                <div className="form-group"><label className="form-label">E-mail</label><input className="input" value={clientData.email || ""} onChange={e => setClientData(p => ({ ...p, email: e.target.value }))} /></div>
              </div>

              {/* Endereço Pessoal */}
              <div className="modal-section">
                <div className="modal-section-title"><MapPin size={15} /> Endereço Pessoal</div>
                <div className="form-group">
                  <label className="form-label">CEP</label>
                  <div className="input-with-status">
                    <input className="input" value={clientData.cep || ""} onChange={e => handleClientCepChange(e.target.value)} placeholder="00000-000" style={{ maxWidth: 180 }} />
                    <StatusBadge status={clientCepStatus} />
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Logradouro</label><input className="input" value={clientData.logradouro || ""} onChange={e => setClientData(p => ({ ...p, logradouro: e.target.value }))} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div className="form-group"><label className="form-label">Número</label><input className="input" value={clientData.numero || ""} onChange={e => setClientData(p => ({ ...p, numero: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Complemento</label><input className="input" value={clientData.complemento || ""} onChange={e => setClientData(p => ({ ...p, complemento: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Bairro</label><input className="input" value={clientData.bairro || ""} onChange={e => setClientData(p => ({ ...p, bairro: e.target.value }))} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                  <div className="form-group"><label className="form-label">Cidade</label><input className="input" value={clientData.cidade || ""} onChange={e => setClientData(p => ({ ...p, cidade: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">UF</label><input className="input" value={clientData.uf || ""} onChange={e => setClientData(p => ({ ...p, uf: e.target.value }))} maxLength={2} /></div>
                </div>
              </div>

              {/* Contato */}
              <div className="modal-section">
                <div className="modal-section-title"><Phone size={15} /> Contato</div>
                <div className="form-group"><label className="form-label">Responsável / Contato</label><input className="input" value={clientData.contact_name || ""} onChange={e => setClientData(p => ({ ...p, contact_name: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Observações</label><textarea className="input" value={clientData.notes || ""} onChange={e => setClientData(p => ({ ...p, notes: e.target.value }))} rows={3} /></div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="input" value={clientData.process_status} onChange={e => setClientData(p => ({ ...p, process_status: e.target.value as ProcessStatus }))}>
                    {statusOptions.map(s => <option key={s} value={s}>{PROCESS_STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => { setShowClientForm(false); resetClientForm(); }}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleSaveClient}>{editClientId ? "Salvar" : "Cadastrar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         COMPANY FORM MODAL
         ═══════════════════════════════════════════════════════════════ */}
      {showCompanyForm && (
        <div className="modal-backdrop" onClick={() => { setShowCompanyForm(false); resetCompanyForm(); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{editCompanyId ? "Editar Empresa" : "Nova Empresa"}</h3>
              <button className="btn btn--icon btn--ghost" onClick={() => { setShowCompanyForm(false); resetCompanyForm(); }}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {/* Dados da Empresa */}
              <div className="modal-section">
                <div className="modal-section-title"><Building2 size={15} /> Dados da Empresa</div>
                <div className="form-group">
                  <label className="form-label">CNPJ *</label>
                  <div className="input-with-status">
                    <input className="input" value={companyData.cnpj || ""} onChange={e => handleCnpjChange(e.target.value)} placeholder="00.000.000/0000-00" />
                    <StatusBadge status={cnpjStatus} />
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Razão Social *</label><input className="input" value={companyData.razao_social || ""} onChange={e => setCompanyData(p => ({ ...p, razao_social: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Nome Fantasia</label><input className="input" value={companyData.nome_fantasia || ""} onChange={e => setCompanyData(p => ({ ...p, nome_fantasia: e.target.value }))} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group"><label className="form-label">CNAE</label><input className="input" value={companyData.cnae_fiscal || ""} onChange={e => setCompanyData(p => ({ ...p, cnae_fiscal: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Situação</label><input className="input" value={companyData.situacao_cadastral || ""} onChange={e => setCompanyData(p => ({ ...p, situacao_cadastral: e.target.value }))} readOnly={cnpjStatus === "success"} style={cnpjStatus === "success" ? { opacity: .7 } : {}} /></div>
                </div>
              </div>

              {/* Endereço Comercial */}
              <div className="modal-section">
                <div className="modal-section-title"><MapPin size={15} /> Endereço Comercial</div>
                <div className="form-group">
                  <label className="form-label">CEP</label>
                  <div className="input-with-status">
                    <input className="input" value={companyData.cep || ""} onChange={e => handleCompanyCepChange(e.target.value)} placeholder="00000-000" style={{ maxWidth: 180 }} />
                    <StatusBadge status={cepStatus} />
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Logradouro</label><input className="input" value={companyData.logradouro || ""} onChange={e => setCompanyData(p => ({ ...p, logradouro: e.target.value }))} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div className="form-group"><label className="form-label">Número</label><input className="input" value={companyData.numero || ""} onChange={e => setCompanyData(p => ({ ...p, numero: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Complemento</label><input className="input" value={companyData.complemento || ""} onChange={e => setCompanyData(p => ({ ...p, complemento: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Bairro</label><input className="input" value={companyData.bairro || ""} onChange={e => setCompanyData(p => ({ ...p, bairro: e.target.value }))} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                  <div className="form-group"><label className="form-label">Cidade</label><input className="input" value={companyData.cidade || ""} onChange={e => setCompanyData(p => ({ ...p, cidade: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">UF</label><input className="input" value={companyData.uf || ""} onChange={e => setCompanyData(p => ({ ...p, uf: e.target.value }))} maxLength={2} /></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => { setShowCompanyForm(false); resetCompanyForm(); }}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleSaveCompany}>{editCompanyId ? "Salvar" : "Cadastrar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
