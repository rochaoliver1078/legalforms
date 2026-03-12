// ==============================================
// LEGALFORMS — Global State (Zustand)
// ==============================================

import { create } from 'zustand';
import { Form, FormField } from './types';
import { uid } from './utils';
import { FIELD_TYPES } from './field-definitions';

// --- API HELPERS ---
const api = {
  async getForms(): Promise<Form[]> {
    const res = await fetch('/api/forms');
    return res.ok ? res.json() : [];
  },
  async getForm(id: string): Promise<Form | null> {
    const res = await fetch(`/api/forms?id=${id}`);
    return res.ok ? res.json() : null;
  },
  async createForm(data: Partial<Form>): Promise<Form | null> {
    const res = await fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok ? res.json() : null;
  },
  async updateForm(data: Partial<Form> & { id: string }): Promise<Form | null> {
    const res = await fetch('/api/forms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok ? res.json() : null;
  },
  async deleteForm(id: string): Promise<void> {
    await fetch(`/api/forms?id=${id}`, { method: 'DELETE' });
  },
  async submitForm(data: { form_id: string; data: Record<string, any>; submitted_by?: string }): Promise<any> {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok ? res.json() : null;
  },
  async getSubmissions(formId: string): Promise<any[]> {
    const res = await fetch(`/api/submissions?form_id=${formId}`);
    return res.ok ? res.json() : [];
  },
  async uploadFile(file: File, formId: string, fieldId: string): Promise<any> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('form_id', formId);
    fd.append('field_id', fieldId);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    return res.ok ? res.json() : null;
  },
};

export { api };

// --- STORE ---
interface AppStore {
  // Data
  forms: Form[];
  loading: boolean;
  saving: boolean;

  // UI
  toast: string;
  viewMode: 'grid' | 'list';
  search: string;

  // Actions
  setForms: (forms: Form[]) => void;
  setLoading: (v: boolean) => void;
  setSaving: (v: boolean) => void;
  setToast: (msg: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSearch: (search: string) => void;

  // Form CRUD
  loadForms: () => Promise<void>;
  createForm: (data: Partial<Form>) => Promise<Form | null>;
  updateForm: (id: string, updates: Partial<Form>) => void;
  deleteForm: (id: string) => Promise<void>;

  // Field operations
  addField: (formId: string, fields: FormField[], type: string) => FormField[];
  updateField: (fields: FormField[], fieldId: string, updates: Partial<FormField>) => FormField[];
  deleteField: (fields: FormField[], fieldId: string) => FormField[];
  moveField: (fields: FormField[], fieldId: string, direction: number) => FormField[];
}

let saveTimer: NodeJS.Timeout | null = null;

export const useAppStore = create<AppStore>((set, get) => ({
  // Data
  forms: [],
  loading: true,
  saving: false,

  // UI
  toast: '',
  viewMode: 'grid',
  search: '',

  // Setters
  setForms: (forms) => set({ forms }),
  setLoading: (loading) => set({ loading }),
  setSaving: (saving) => set({ saving }),
  setToast: (msg) => {
    set({ toast: msg });
    if (msg) setTimeout(() => set({ toast: '' }), 3000);
  },
  setViewMode: (viewMode) => set({ viewMode }),
  setSearch: (search) => set({ search }),

  // Form CRUD
  loadForms: async () => {
    set({ loading: true });
    try {
      const data = await api.getForms();
      set({ forms: Array.isArray(data) ? data : [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createForm: async (data) => {
    const result = await api.createForm(data);
    if (result) {
      set((s) => ({ forms: [{ ...result, response_count: 0 }, ...s.forms] }));
      get().setToast('Formulário criado!');
    }
    return result;
  },

  updateForm: (id, updates) => {
    set((s) => ({
      forms: s.forms.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));

    // Debounced save to API
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const form = get().forms.find((f) => f.id === id);
      if (form) {
        set({ saving: true });
        const { id: _fid, ...rest } = form;
        await api.updateForm({ id, ...rest, ...updates });
        set({ saving: false });
      }
    }, 800);
  },

  deleteForm: async (id) => {
    await api.deleteForm(id);
    set((s) => ({ forms: s.forms.filter((f) => f.id !== id) }));
    get().setToast('Formulário excluído');
  },

  // Field operations
  addField: (_formId, fields, type) => {
    const ft = FIELD_TYPES.find((t) => t.type === type);
    const newField: FormField = {
      id: uid(),
      type: type as any,
      label: ft?.label || type,
      required: false,
      placeholder: '',
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Opção 1', 'Opção 2'] : undefined,
    };
    return [...fields, newField];
  },

  updateField: (fields, fieldId, updates) => {
    return fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f));
  },

  deleteField: (fields, fieldId) => {
    return fields.filter((f) => f.id !== fieldId);
  },

  moveField: (fields, fieldId, direction) => {
    const index = fields.findIndex((f) => f.id === fieldId);
    if (index < 0) return fields;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return fields;
    const arr = [...fields];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    return arr;
  },
}));
