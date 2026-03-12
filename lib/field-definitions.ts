// ==============================================
// LEGALFORMS — Field Type Definitions
// ==============================================

import { FieldTypeDefinition, FormField, FormTemplate } from './types';

// Brazilian UF list
export const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

// All available field types
export const FIELD_TYPES: FieldTypeDefinition[] = [
  { type: 'text',       label: 'Texto',              icon: 'Aa',  cat: 'basic' },
  { type: 'textarea',   label: 'Texto longo',        icon: '¶',   cat: 'basic' },
  { type: 'email',      label: 'E-mail',             icon: '@',   cat: 'basic' },
  { type: 'phone',      label: 'Telefone',           icon: '☎',   cat: 'basic' },
  { type: 'number',     label: 'Número',             icon: '#',   cat: 'basic' },
  { type: 'date',       label: 'Data',               icon: '📅',  cat: 'basic' },
  { type: 'select',     label: 'Dropdown',           icon: '▾',   cat: 'basic' },
  { type: 'radio',      label: 'Múltipla escolha',   icon: '◉',   cat: 'basic' },
  { type: 'checkbox',   label: 'Checkbox',           icon: '☑',   cat: 'basic' },
  { type: 'file',       label: 'Upload',             icon: '📎',  cat: 'basic' },
  { type: 'cpf',        label: 'CPF',                icon: 'ID',  cat: 'legal' },
  { type: 'cnpj',       label: 'CNPJ',               icon: '§',   cat: 'legal' },
  { type: 'cep',        label: 'CEP',                icon: '📍',  cat: 'legal' },
  { type: 'currency',   label: 'Valor R$',           icon: 'R$',  cat: 'legal' },
  { type: 'heading',    label: 'Título / Seção',     icon: 'H',   cat: 'layout' },
  { type: 'separator',  label: 'Separador',          icon: '—',   cat: 'layout' },
  { type: 'socios',     label: 'Bloco de Sócios',    icon: '👥',  cat: 'smart' },
  { type: 'alt_events', label: 'Seletor de Alterações', icon: '⚡', cat: 'smart' },
];

export const FIELD_CATEGORIES = [
  { key: 'basic', title: 'Básicos' },
  { key: 'legal', title: 'Legalização' },
  { key: 'layout', title: 'Layout' },
  { key: 'smart', title: 'Inteligentes' },
] as const;

// Generate socio sub-fields for partner N
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

// Alteration event types with sub-fields
export interface AlterationEvent {
  id: string;
  label: string;
  fields: FormField[];
}

export const ALTERATION_EVENTS: AlterationEvent[] = [
  {
    id: 'alt_end', label: 'Alterar endereço',
    fields: [
      { id: 'ae_cep', type: 'cep', label: 'Novo CEP', required: true },
      { id: 'ae_logr', type: 'text', label: 'Logradouro', required: true },
      { id: 'ae_num', type: 'text', label: 'Número', required: true },
      { id: 'ae_bairro', type: 'text', label: 'Bairro', required: true },
      { id: 'ae_cidade', type: 'text', label: 'Cidade', required: true },
      { id: 'ae_uf', type: 'select', label: 'UF', required: true, options: UFS },
    ],
  },
  {
    id: 'alt_sin', label: 'Entrada de sócio',
    fields: [
      { id: 'asi_nome', type: 'text', label: 'Nome do novo sócio', required: true },
      { id: 'asi_cpf', type: 'cpf', label: 'CPF', required: true },
      { id: 'asi_qualif', type: 'textarea', label: 'Qualificação completa', required: true },
      { id: 'asi_valor', type: 'currency', label: 'Valor (R$)', required: true },
      { id: 'asi_doc', type: 'file', label: 'RG/CNH', required: true },
    ],
  },
  {
    id: 'alt_sout', label: 'Saída de sócio',
    fields: [
      { id: 'aso_nome', type: 'text', label: 'Sócio retirante', required: true },
      { id: 'aso_cpf', type: 'cpf', label: 'CPF', required: true },
      { id: 'aso_dest', type: 'select', label: 'Destino das quotas', required: true, options: ['Transferir p/ remanescente', 'Transferir p/ terceiro', 'Reduzir capital'] },
    ],
  },
  {
    id: 'alt_cnae', label: 'Alterar CNAE',
    fields: [
      { id: 'ac_add', type: 'textarea', label: 'CNAEs a incluir', required: false },
      { id: 'ac_rem', type: 'textarea', label: 'CNAEs a excluir', required: false },
    ],
  },
  {
    id: 'alt_cap', label: 'Alterar capital',
    fields: [
      { id: 'ak_atual', type: 'currency', label: 'Capital atual (R$)', required: true },
      { id: 'ak_novo', type: 'currency', label: 'Novo capital (R$)', required: true },
      { id: 'ak_dist', type: 'textarea', label: 'Nova distribuição', required: true },
    ],
  },
  {
    id: 'alt_razao', label: 'Alterar razão social',
    fields: [
      { id: 'ar_nova1', type: 'text', label: 'Nova razão (1ª opção)', required: true },
      { id: 'ar_nova2', type: 'text', label: '2ª opção', required: false },
    ],
  },
  {
    id: 'alt_admin', label: 'Alterar administrador',
    fields: [
      { id: 'aa_novo', type: 'text', label: 'Novo administrador', required: true },
      { id: 'aa_cpf', type: 'cpf', label: 'CPF', required: true },
    ],
  },
  {
    id: 'alt_obj', label: 'Alterar objeto social',
    fields: [
      { id: 'ao_novo', type: 'textarea', label: 'Novo objeto social', required: true },
    ],
  },
  {
    id: 'alt_transf', label: 'Transformação societária',
    fields: [
      { id: 'at_de', type: 'select', label: 'Tipo atual', required: true, options: ['MEI', 'EI', 'SLU', 'LTDA', 'S/A'] },
      { id: 'at_para', type: 'select', label: 'Transformar para', required: true, options: ['MEI', 'EI', 'SLU', 'LTDA', 'S/A'] },
    ],
  },
];

// Pre-built templates for legal processes
export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'tpl_abertura',
    name: 'Abertura de Empresa',
    icon: '🏢',
    color: '#10b981',
    description: 'Coleta completa para abertura de empresa (LTDA, EI, MEI)',
    category: 'abertura',
    fields: [
      { id: 'h1', type: 'heading', label: '📋 Dados da Empresa', required: false },
      { id: 'razao1', type: 'text', label: 'Razão social (1ª opção)', required: true, placeholder: 'Ex: Silva Consultoria LTDA' },
      { id: 'razao2', type: 'text', label: 'Razão social (2ª opção)', required: false },
      { id: 'razao3', type: 'text', label: 'Razão social (3ª opção)', required: false },
      { id: 'fantasia', type: 'text', label: 'Nome fantasia', required: true },
      { id: 'tipo', type: 'select', label: 'Tipo jurídico', required: true, options: ['MEI', 'EI', 'SLU', 'LTDA', 'S/A'] },
      { id: 'cnae_p', type: 'text', label: 'CNAE principal', required: true, placeholder: 'Ex: 6201-5/01' },
      { id: 'cnae_s', type: 'textarea', label: 'CNAEs secundários', required: false, placeholder: 'Um por linha' },
      { id: 'obj', type: 'textarea', label: 'Objeto social', required: true },
      { id: 'capital', type: 'currency', label: 'Capital social (R$)', required: true },
      { id: 'sep1', type: 'separator', label: '', required: false },
      { id: 'h2', type: 'heading', label: '📍 Endereço da Empresa', required: false },
      { id: 'cep', type: 'cep', label: 'CEP', required: true },
      { id: 'logr', type: 'text', label: 'Logradouro', required: true },
      { id: 'num', type: 'text', label: 'Número', required: true },
      { id: 'compl', type: 'text', label: 'Complemento', required: false },
      { id: 'bairro', type: 'text', label: 'Bairro', required: true },
      { id: 'cidade', type: 'text', label: 'Cidade', required: true },
      { id: 'uf', type: 'select', label: 'UF', required: true, options: UFS },
      { id: 'sep2', type: 'separator', label: '', required: false },
      { id: 'h3', type: 'heading', label: '👥 Sócios', required: false },
      { id: 'socios', type: 'socios', label: 'Dados dos Sócios', required: false },
      { id: 'sep3', type: 'separator', label: '', required: false },
      { id: 'h4', type: 'heading', label: '📎 Documentos', required: false },
      { id: 'iptu', type: 'file', label: 'IPTU do endereço comercial', required: true },
      { id: 'contrato_loc', type: 'file', label: 'Contrato de locação (se aplicável)', required: false },
      { id: 'obs', type: 'textarea', label: 'Observações adicionais', required: false },
      { id: 'resp', type: 'text', label: 'Responsável pelo preenchimento', required: true },
      { id: 'resp_email', type: 'email', label: 'E-mail para contato', required: true },
      { id: 'resp_tel', type: 'phone', label: 'Telefone para contato', required: true },
    ],
  },
  {
    id: 'tpl_alteracao',
    name: 'Alteração Contratual',
    icon: '📝',
    color: '#f59e0b',
    description: 'Alteração contratual com seleção de múltiplos eventos',
    category: 'alteracao',
    fields: [
      { id: 'h1', type: 'heading', label: '🏢 Dados da Empresa', required: false },
      { id: 'razao', type: 'text', label: 'Razão social atual', required: true },
      { id: 'cnpj', type: 'cnpj', label: 'CNPJ', required: true },
      { id: 'ie', type: 'text', label: 'Inscrição Estadual', required: false },
      { id: 'im', type: 'text', label: 'Inscrição Municipal', required: false },
      { id: 'sep1', type: 'separator', label: '', required: false },
      { id: 'h2', type: 'heading', label: '⚡ Alterações Solicitadas', required: false },
      { id: 'alt_events', type: 'alt_events', label: 'Selecione as alterações', required: false },
      { id: 'sep2', type: 'separator', label: '', required: false },
      { id: 'h3', type: 'heading', label: '📄 Informações Adicionais', required: false },
      { id: 'obs_alt', type: 'textarea', label: 'Observações', required: false },
      { id: 'resp_alt', type: 'text', label: 'Responsável pelo preenchimento', required: true },
      { id: 'resp_alt_email', type: 'email', label: 'E-mail para contato', required: true },
      { id: 'resp_alt_tel', type: 'phone', label: 'Telefone', required: true },
    ],
  },
  {
    id: 'tpl_baixa',
    name: 'Baixa / Encerramento',
    icon: '🔴',
    color: '#ef4444',
    description: 'Encerramento de empresa com checklist completo',
    category: 'baixa',
    fields: [
      { id: 'h1', type: 'heading', label: '🏢 Dados da Empresa', required: false },
      { id: 'razao', type: 'text', label: 'Razão social', required: true },
      { id: 'fantasia', type: 'text', label: 'Nome fantasia', required: false },
      { id: 'cnpj', type: 'cnpj', label: 'CNPJ', required: true },
      { id: 'ie', type: 'text', label: 'Inscrição Estadual', required: false },
      { id: 'im', type: 'text', label: 'Inscrição Municipal', required: false },
      { id: 'sep1', type: 'separator', label: '', required: false },
      { id: 'h2', type: 'heading', label: '📋 Motivo e Detalhes', required: false },
      { id: 'motivo', type: 'select', label: 'Motivo do encerramento', required: true, options: ['Encerramento voluntário', 'Incorporação', 'Fusão', 'Transformação', 'Falência', 'Outro'] },
      { id: 'dt_encerramento', type: 'date', label: 'Data pretendida de encerramento', required: true },
      { id: 'ultimo_faturamento', type: 'date', label: 'Data do último faturamento', required: true },
      { id: 'dividas', type: 'radio', label: 'Possui débitos pendentes?', required: true, options: ['Sim', 'Não', 'Não sei'] },
      { id: 'dividas_det', type: 'textarea', label: 'Detalhes dos débitos (se houver)', required: false },
      { id: 'funcionarios', type: 'radio', label: 'Possui funcionários ativos?', required: true, options: ['Sim', 'Não'] },
      { id: 'sep2', type: 'separator', label: '', required: false },
      { id: 'h3', type: 'heading', label: '👤 Sócios/Titular', required: false },
      { id: 'socios', type: 'socios', label: 'Dados dos Sócios', required: false },
      { id: 'sep3', type: 'separator', label: '', required: false },
      { id: 'h4', type: 'heading', label: '📎 Documentos', required: false },
      { id: 'cert_neg', type: 'file', label: 'Certidão negativa da Receita Federal', required: false },
      { id: 'cert_fgts', type: 'file', label: 'Certidão de regularidade FGTS', required: false },
      { id: 'livros', type: 'radio', label: 'Livros contábeis estão em ordem?', required: true, options: ['Sim', 'Em processo', 'Não'] },
      { id: 'obs_baixa', type: 'textarea', label: 'Observações adicionais', required: false },
      { id: 'resp_baixa', type: 'text', label: 'Responsável pelo preenchimento', required: true },
      { id: 'resp_baixa_email', type: 'email', label: 'E-mail para contato', required: true },
      { id: 'resp_baixa_tel', type: 'phone', label: 'Telefone', required: true },
    ],
  },
  {
    id: 'tpl_blank',
    name: 'Formulário em Branco',
    icon: '📋',
    color: '#FF6100',
    description: 'Comece do zero e crie seu próprio formulário',
    category: 'geral',
    fields: [],
  },
];
