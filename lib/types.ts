// ==============================================
// LEGALFORMS — TypeScript Types
// ==============================================

export type FieldType =
  | 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'date'
  | 'select' | 'radio' | 'checkbox' | 'file'
  | 'cpf' | 'cnpj' | 'cep' | 'currency'
  | 'heading' | 'separator'
  | 'socios' | 'alt_events';

export type FieldCategory = 'basic' | 'legal' | 'layout' | 'smart';

export interface FieldTypeDefinition {
  type: FieldType;
  label: string;
  icon: string;
  cat: FieldCategory;
}

export interface ConditionalRule {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_empty' | 'empty';
  value: string;
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
  _group?: string; // Runtime only — used during fill
}

export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  borderRadius: 'sharp' | 'rounded' | 'pill';
  logoUrl?: string;
}

export interface FormSettings {
  showProgressBar: boolean;
  confirmationMessage: string;
  redirectUrl?: string;
  maxSubmissions?: number;
  closedMessage?: string;
  requireLogin: boolean;
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
  status?: 'active' | 'closed' | 'draft';
  folder_id?: string;
  created_at: string;
  updated_at: string;
  response_count?: number;
}

export interface Submission {
  id: string;
  form_id: string;
  data: Record<string, any>;
  files: { field_id: string; url: string; name: string }[];
  submitted_by: string | null;
  submitted_at: string;
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
