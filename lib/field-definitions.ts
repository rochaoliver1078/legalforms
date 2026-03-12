// ==============================================
// LEGALFORMS v2 — Field Definitions
// ==============================================

import { FieldTypeDefinition, FormField, FormTemplate, TableColumn } from './types';

export const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export const FIELD_TYPES: FieldTypeDefinition[] = [
  { type: 'text', label: 'Texto', icon: 'Aa', cat: 'basic' },
  { type: 'textarea', label: 'Texto longo', icon: '¶', cat: 'basic' },
  { type: 'email', label: 'E-mail', icon: '@', cat: 'basic' },
  { type: 'phone', label: 'Telefone', icon: '☎', cat: 'basic' },
  { type: 'number', label: 'Número', icon: '#', cat: 'basic' },
  { type: 'date', label: 'Data', icon: '📅', cat: 'basic' },
  { type: 'select', label: 'Dropdown', icon: '▾', cat: 'basic' },
  { type: 'radio', label: 'Múltipla escolha', icon: '◉', cat: 'basic' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑', cat: 'basic' },
  { type: 'file', label: 'Upload', icon: '📎', cat: 'basic' },
  { type: 'cpf', label: 'CPF', icon: 'ID', cat: 'legal' },
  { type: 'cnpj', label: 'CNPJ', icon: '§', cat: 'legal' },
  { type: 'cep', label: 'CEP', icon: '📍', cat: 'legal' },
  { type: 'currency', label: 'Valor R$', icon: 'R$', cat: 'legal' },
  { type: 'cnpj_search', label: 'CNPJ + Busca', icon: '🔍', cat: 'legal' },
  { type: 'cep_autofill', label: 'CEP + Auto', icon: '📍', cat: 'legal' },
  { type: 'heading', label: 'Título / Seção', icon: 'H', cat: 'layout' },
  { type: 'separator', label: 'Separador', icon: '—', cat: 'layout' },
  { type: 'page_break', label: 'Quebra de Página', icon: '📄', cat: 'layout' },
  { type: 'socios', label: 'Bloco de Sócios', icon: '👥', cat: 'smart' },
  { type: 'alt_events', label: 'Seletor de Alterações', icon: '⚡', cat: 'smart' },
  { type: 'rating', label: 'Avaliação', icon: '⭐', cat: 'advanced' },
  { type: 'table', label: 'Tabela / Grid', icon: '▦', cat: 'advanced' },
  { type: 'lgpd', label: 'Aceite LGPD', icon: '🔒', cat: 'advanced' },
];

export const FIELD_CATEGORIES = [
  { key: 'basic', title: 'Básicos' },
  { key: 'legal', title: 'Legalização' },
  { key: 'layout', title: 'Layout' },
  { key: 'smart', title: 'Inteligentes' },
  { key: 'advanced', title: 'Avançados' },
] as const;

export const DEFAULT_TABLE_COLUMNS: TableColumn[] = [
  { id: 'col1', label: 'Coluna 1', type: 'text' },
  { id: 'col2', label: 'Coluna 2', type: 'text' },
  { id: 'col3', label: 'Coluna 3', type: 'number' },
];

export function createSocioFields(n: number): FormField[] {
  return [
    { id: `s${n}_nome`, type: 'text', label: 'Nome completo', required: true, placeholder: 'Conforme documento' },
    { id: `s${n}_cpf`, type: 'cpf', label: 'CPF', required: true, placeholder: '000.000.000-00' },
    { id: `s${n}_rg`, type: 'text', label: 'RG e órgão emissor', required: true },
    { id: `s${n}_nasc`, type: 'date', label: 'Data de nascimento', required: true },
    { id: `s${n}_civil`, type: 'select', label: 'Estado civil', required: true, options: ['Solteiro(a)', 'Casado(a) — Comunhão parcial', 'Casado(a) — Comunhão universal', 'Casado(a) — Separação total', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'] },
    { id: `s${n}_prof`, type: 'text', label: 'Profissão', required: true },
    { id: `s${n}_email`, type: 'email', label: 'E-mail', required: true },
    { id: `s${n}_tel`, type: 'phone', label: 'Celular', required: true, placeholder: '(00) 00000-0000' },
    { id: `s${n}_end`, type: 'textarea', label: 'Endereço completo', required: true, placeholder: 'Rua, nº, bairro, cidade-UF, CEP' },
    { id: `s${n}_pct`, type: 'text', label: 'Participação no capital (%)', required: true },
    { id: `s${n}_admin`, type: 'radio', label: 'Será administrador?', required: true, options: ['Sim', 'Não'] },
    { id: `s${n}_cert`, type: 'radio', label: 'Possui e-CPF?', required: true, options: ['Sim', 'Não', 'Vou providenciar'] },
    { id: `s${n}_doc`, type: 'file', label: 'RG ou CNH', required: true },
  ];
}

export interface AlterationEvent { id: string; label: string; fields: FormField[]; }

export const ALTERATION_EVENTS: AlterationEvent[] = [
  { id: 'alt_end', label: 'Alterar endereço', fields: [
    { id: 'ae_cep', type: 'cep', label: 'Novo CEP', required: true },
    { id: 'ae_logr', type: 'text', label: 'Logradouro', required: true },
    { id: 'ae_num', type: 'text', label: 'Número', required: true },
    { id: 'ae_bairro', type: 'text', label: 'Bairro', required: true },
    { id: 'ae_cidade', type: 'text', label: 'Cidade', required: true },
    { id: 'ae_uf', type: 'select', label: 'UF', required: true, options: UFS },
  ]},
  { id: 'alt_sin', label: 'Entrada de sócio', fields: [
    { id: 'asi_nome', type: 'text', label: 'Nome do novo sócio', required: true },
    { id: 'asi_cpf', type: 'cpf', label: 'CPF', required: true },
    { id: 'asi_qualif', type: 'textarea', label: 'Qualificação completa', required: true },
    { id: 'asi_valor', type: 'currency', label: 'Valor (R$)', required: true },
    { id: 'asi_doc', type: 'file', label: 'RG/CNH', required: true },
  ]},
  { id: 'alt_sout', label: 'Saída de sócio', fields: [
    { id: 'aso_nome', type: 'text', label: 'Sócio retirante', required: true },
    { id: 'aso_cpf', type: 'cpf', label: 'CPF', required: true },
    { id: 'aso_dest', type: 'select', label: 'Destino das quotas', required: true, options: ['Transferir p/ remanescente', 'Transferir p/ terceiro', 'Reduzir capital'] },
  ]},
  { id: 'alt_cnae', label: 'Alterar CNAE', fields: [
    { id: 'ac_add', type: 'textarea', label: 'CNAEs a incluir', required: false },
    { id: 'ac_rem', type: 'textarea', label: 'CNAEs a excluir', required: false },
  ]},
  { id: 'alt_cap', label: 'Alterar capital', fields: [
    { id: 'ak_atual', type: 'currency', label: 'Capital atual', required: true },
    { id: 'ak_novo', type: 'currency', label: 'Novo capital', required: true },
    { id: 'ak_dist', type: 'textarea', label: 'Nova distribuição', required: true },
  ]},
  { id: 'alt_razao', label: 'Alterar razão social', fields: [
    { id: 'ar_nova1', type: 'text', label: 'Nova razão (1ª opção)', required: true },
    { id: 'ar_nova2', type: 'text', label: '2ª opção', required: false },
  ]},
  { id: 'alt_admin', label: 'Alterar administrador', fields: [
    { id: 'aa_novo', type: 'text', label: 'Novo administrador', required: true },
    { id: 'aa_cpf', type: 'cpf', label: 'CPF', required: true },
  ]},
  { id: 'alt_obj', label: 'Alterar objeto social', fields: [
    { id: 'ao_novo', type: 'textarea', label: 'Novo objeto social', required: true },
  ]},
  { id: 'alt_transf', label: 'Transformação societária', fields: [
    { id: 'at_de', type: 'select', label: 'Tipo atual', required: true, options: ['MEI', 'EI', 'SLU', 'LTDA', 'S/A'] },
    { id: 'at_para', type: 'select', label: 'Transformar para', required: true, options: ['MEI', 'EI', 'SLU', 'LTDA', 'S/A'] },
  ]},
];

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'tpl_abertura', name: 'Abertura de Empresa', icon: '🏢', color: '#10b981',
    description: 'Coleta completa para abertura de empresa', category: 'abertura',
    fields: [
      { id: 'h1', type: 'heading', label: '📋 Dados da Empresa', required: false },
      { id: 'razao1', type: 'text', label: 'Razão social (1ª opção)', required: true },
      { id: 'razao2', type: 'text', label: 'Razão social (2ª opção)', required: false },
      { id: 'fantasia', type: 'text', label: 'Nome fantasia', required: true },
      { id: 'tipo', type: 'select', label: 'Tipo jurídico', required: true, options: ['MEI', 'EI', 'SLU', 'LTDA', 'S/A'] },
      { id: 'cnae_p', type: 'text', label: 'CNAE principal', required: true },
      { id: 'cnae_s', type: 'textarea', label: 'CNAEs secundários', required: false },
      { id: 'obj', type: 'textarea', label: 'Objeto social', required: true },
      { id: 'capital', type: 'currency', label: 'Capital social (R$)', required: true },
      { id: 'pb1', type: 'page_break', label: 'Página 2', required: false },
      { id: 'h2', type: 'heading', label: '📍 Endereço', required: false },
      { id: 'cep', type: 'cep_autofill', label: 'CEP', required: true },
      { id: 'logr', type: 'text', label: 'Logradouro', required: true },
      { id: 'num', type: 'text', label: 'Número', required: true },
      { id: 'bairro', type: 'text', label: 'Bairro', required: true },
      { id: 'cidade', type: 'text', label: 'Cidade', required: true },
      { id: 'uf', type: 'select', label: 'UF', required: true, options: UFS },
      { id: 'pb2', type: 'page_break', label: 'Página 3', required: false },
      { id: 'h3', type: 'heading', label: '👥 Sócios', required: false },
      { id: 'socios', type: 'socios', label: 'Dados dos Sócios', required: false },
      { id: 'pb3', type: 'page_break', label: 'Página 4', required: false },
      { id: 'h4', type: 'heading', label: '📎 Documentos', required: false },
      { id: 'iptu', type: 'file', label: 'IPTU do endereço', required: true },
      { id: 'obs', type: 'textarea', label: 'Observações', required: false },
      { id: 'resp', type: 'text', label: 'Responsável', required: true },
      { id: 'resp_email', type: 'email', label: 'E-mail', required: true },
      { id: 'resp_tel', type: 'phone', label: 'Telefone', required: true },
      { id: 'lgpd', type: 'lgpd', label: 'Aceite LGPD', required: true },
    ],
  },
  {
    id: 'tpl_alteracao', name: 'Alteração Contratual', icon: '📝', color: '#f59e0b',
    description: 'Alteração contratual com múltiplos eventos', category: 'alteracao',
    fields: [
      { id: 'h1', type: 'heading', label: '🏢 Dados da Empresa', required: false },
      { id: 'razao', type: 'text', label: 'Razão social atual', required: true },
      { id: 'cnpj', type: 'cnpj_search', label: 'CNPJ', required: true },
      { id: 'pb1', type: 'page_break', label: 'Alterações', required: false },
      { id: 'h2', type: 'heading', label: '⚡ Alterações', required: false },
      { id: 'alt_events', type: 'alt_events', label: 'Selecione as alterações', required: false },
      { id: 'pb2', type: 'page_break', label: 'Contato', required: false },
      { id: 'obs_alt', type: 'textarea', label: 'Observações', required: false },
      { id: 'resp_alt', type: 'text', label: 'Responsável', required: true },
      { id: 'resp_alt_email', type: 'email', label: 'E-mail', required: true },
      { id: 'lgpd', type: 'lgpd', label: 'Aceite LGPD', required: true },
    ],
  },
  {
    id: 'tpl_baixa', name: 'Baixa / Encerramento', icon: '🔴', color: '#ef4444',
    description: 'Encerramento completo de empresa', category: 'baixa',
    fields: [
      { id: 'h1', type: 'heading', label: '🏢 Dados da Empresa', required: false },
      { id: 'razao', type: 'text', label: 'Razão social', required: true },
      { id: 'cnpj', type: 'cnpj_search', label: 'CNPJ', required: true },
      { id: 'pb1', type: 'page_break', label: 'Detalhes', required: false },
      { id: 'motivo', type: 'select', label: 'Motivo', required: true, options: ['Encerramento voluntário', 'Incorporação', 'Fusão', 'Falência', 'Outro'] },
      { id: 'dt_enc', type: 'date', label: 'Data pretendida', required: true },
      { id: 'dividas', type: 'radio', label: 'Débitos pendentes?', required: true, options: ['Sim', 'Não', 'Não sei'] },
      { id: 'func', type: 'radio', label: 'Funcionários ativos?', required: true, options: ['Sim', 'Não'] },
      { id: 'pb2', type: 'page_break', label: 'Sócios', required: false },
      { id: 'socios', type: 'socios', label: 'Dados dos Sócios', required: false },
      { id: 'obs_baixa', type: 'textarea', label: 'Observações', required: false },
      { id: 'resp_baixa', type: 'text', label: 'Responsável', required: true },
      { id: 'resp_baixa_email', type: 'email', label: 'E-mail', required: true },
      { id: 'lgpd', type: 'lgpd', label: 'Aceite LGPD', required: true },
    ],
  },
  {
    id: 'tpl_blank', name: 'Formulário em Branco', icon: '📋', color: '#FF6100',
    description: 'Comece do zero', category: 'geral', fields: [],
  },
];

// CEP auto-fill via ViaCEP
export async function fetchCEP(cep: string): Promise<Record<string, string> | null> {
  try {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return null;
    const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const d = await r.json();
    if (d.erro) return null;
    return { logradouro: d.logradouro, bairro: d.bairro, cidade: d.localidade, uf: d.uf, complemento: d.complemento };
  } catch { return null; }
}

// CNPJ search via BrasilAPI
export async function fetchCNPJ(cnpj: string): Promise<Record<string, string> | null> {
  try {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return null;
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
    const d = await r.json();
    if (d.message) return null;
    return {
      razao_social: d.razao_social, nome_fantasia: d.nome_fantasia,
      logradouro: d.logradouro, numero: d.numero, bairro: d.bairro,
      municipio: d.municipio, uf: d.uf, cep: d.cep,
      cnae_fiscal: `${d.cnae_fiscal}`, situacao: d.descricao_situacao_cadastral,
    };
  } catch { return null; }
}
