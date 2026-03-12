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
