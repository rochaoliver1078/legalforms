// ==============================================
// LEGALFORMS v2 — TypeScript Types
// ==============================================

export type FieldType =
  | 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'date'
  | 'select' | 'radio' | 'checkbox' | 'file'
  | 'cpf' | 'cnpj' | 'cep' | 'currency'
  | 'heading' | 'separator' | 'page_break'
  | 'socios' | 'alt_events'
  | 'rating' | 'table' | 'cnpj_search' | 'cep_autofill' | 'lgpd';

export type FieldCategory = 'basic' | 'legal' | 'layout' | 'smart' | 'advanced';

export interface FieldTypeDefinition {
  type: FieldType;
  label: string;
  icon: string;
  cat: FieldCategory;
}

export interface ConditionalRule {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_empty' | 'empty' | 'greater' | 'less';
  value: string;
  action: 'show' | 'hide' | 'skip';
}

export interface TableColumn {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  description?: string;
  conditional?: ConditionalRule;
  page?: number;
  tableColumns?: TableColumn[];
  maxRating?: number;
  _group?: string;
}

export interface FormTheme {
  primaryColor: string;
  bgColor: string;
  cardBg: string;
  textColor: string;
  fontFamily: string;
  borderRadius: 'sharp' | 'rounded' | 'pill';
  logoUrl?: string;
  coverUrl?: string;
}

export interface FormSettings {
  showProgressBar: boolean;
  progressType: 'dots' | 'bar' | 'percent';
  confirmationMessage: string;
  redirectUrl?: string;
  requireLGPD: boolean;
  lgpdText?: string;
  allowClassicMode: boolean;
  defaultMode: 'card' | 'classic';
}

export interface Form {
  id: string;
  name: string;
  icon: string;
  color: string;
  fields: FormField[];
  emails: string[];
  theme?: FormTheme;
  settings?: FormSettings;
  status?: 'active' | 'closed' | 'draft' | 'archived';
  folder_id?: string;
  tags?: string[];
  version?: number;
  versions?: FormVersion[];
  created_at: string;
  updated_at: string;
  response_count?: number;
}

export interface FormVersion {
  version: number;
  fields: FormField[];
  saved_at: string;
}

export interface Submission {
  id: string;
  form_id: string;
  data: Record<string, any>;
  files: { field_id: string; url: string; name: string }[];
  submitted_by: string | null;
  submitted_at: string;
  status?: 'new' | 'read' | 'processed';
}

export interface FormFolder {
  id: string;
  name: string;
  color: string;
  count?: number;
}

export interface FormTemplate {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  category: 'abertura' | 'alteracao' | 'baixa' | 'geral';
  fields: FormField[];
}

// Undo/Redo history
export interface HistoryEntry {
  fields: FormField[];
  timestamp: number;
}

// v3 — Client Panel
export type ProcessStatus = 'pending' | 'docs_received' | 'analyzing' | 'filed' | 'completed';
export type CompanyRole = 'socio' | 'contador' | 'responsavel' | 'outro';

// Client = pessoa física
export interface Client {
  id: string;
  name: string;
  cpf?: string;
  email: string;
  phone?: string;
  contact_name?: string;
  notes?: string;
  // Personal address
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  process_status: ProcessStatus;
  created_at: string;
  updated_at: string;
}

// Company = pessoa jurídica
export interface Company {
  id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  cnae_fiscal?: string;
  situacao_cadastral?: string;
  // Company address
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  created_at: string;
  updated_at: string;
}

// Link N:N between Client and Company
export interface ClientCompany {
  id: string;
  client_id: string;
  company_id: string;
  role: CompanyRole;
  created_at: string;
}

export const COMPANY_ROLE_LABELS: Record<CompanyRole, string> = {
  socio: 'Sócio',
  contador: 'Contador',
  responsavel: 'Responsável',
  outro: 'Outro',
};

export interface ClientSubmission {
  client_id: string;
  submission: Submission;
  form: Form;
}

export const PROCESS_STATUS_LABELS: Record<ProcessStatus, string> = {
  pending: 'Aguardando docs',
  docs_received: 'Docs recebidos',
  analyzing: 'Em análise',
  filed: 'Protocolado',
  completed: 'Concluído',
};

export const PROCESS_STATUS_COLORS: Record<ProcessStatus, string> = {
  pending: '#f59e0b',
  docs_received: '#3b82f6',
  analyzing: '#8b5cf6',
  filed: '#06b6d4',
  completed: '#10b981',
};

// v4 — Process Control
export type ProcessPriority = 'baixa' | 'normal' | 'urgente';

export interface ProcessTemplate {
  id: string;
  name: string;
  icon: string;
  color: string;
  stages: string[];
  documents: string[];
  form_ids: string[];
  created_at: string;
}

export interface ProcessDocument {
  name: string;
  received: boolean;
  file_url?: string;
}

export interface LegalProcess {
  id: string;
  template_id?: string;
  title: string;
  current_stage: number;
  stages: string[];
  priority: ProcessPriority;
  client_id?: string;
  company_id?: string;
  deadline?: string;
  notes?: string;
  documents: ProcessDocument[];
  created_at: string;
  updated_at: string;
  // Joined
  template?: ProcessTemplate;
  client?: Client;
  company?: Company;
}

export interface ProcessEvent {
  id: string;
  process_id: string;
  type: 'stage_change' | 'note' | 'document' | 'notification' | 'created';
  description: string;
  created_at: string;
}

export const PRIORITY_LABELS: Record<ProcessPriority, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  urgente: 'Urgente',
};

export const PRIORITY_COLORS: Record<ProcessPriority, string> = {
  baixa: '#10b981',
  normal: '#3b82f6',
  urgente: '#ef4444',
};

export const DEFAULT_PROCESS_TEMPLATES: Omit<ProcessTemplate, 'id' | 'created_at'>[] = [
  {
    name: 'Abertura MEI',
    icon: '🏪',
    color: '#10b981',
    stages: ['Coleta de docs', 'Análise', 'Protocolo', 'Deferido'],
    documents: ['RG', 'CPF', 'Comprovante de endereço', 'Título de eleitor'],
    form_ids: [],
  },
  {
    name: 'Abertura LTDA / SLU',
    icon: '🏢',
    color: '#3b82f6',
    stages: ['Coleta de docs', 'Contrato social', 'Junta Comercial', 'Receita Federal', 'Concluído'],
    documents: ['RG dos sócios', 'CPF dos sócios', 'Comprovante de endereço', 'IPTU', 'Contrato social'],
    form_ids: [],
  },
  {
    name: 'Alteração Contratual',
    icon: '📝',
    color: '#8b5cf6',
    stages: ['Coleta de docs', 'Análise', 'Junta Comercial', 'Concluído'],
    documents: ['Contrato social vigente', 'Alteração contratual', 'RG dos sócios'],
    form_ids: [],
  },
  {
    name: 'Baixa / Encerramento',
    icon: '📕',
    color: '#ef4444',
    stages: ['Coleta de docs', 'Distrato', 'Protocolo', 'Concluído'],
    documents: ['Certidão negativa de débitos', 'Alvará original', 'Distrato social'],
    form_ids: [],
  },
];
