-- ===========================================
-- LEGALFORMS — Database Setup
-- Execute este SQL no Supabase SQL Editor
-- ===========================================

-- 1. Tabela de formulários
CREATE TABLE IF NOT EXISTS forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  color TEXT DEFAULT '#FF6100',
  fields JSONB NOT NULL DEFAULT '[]',
  emails TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de respostas
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  files JSONB DEFAULT '[]',
  submitted_by TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_submissions_form ON submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_date ON submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_forms_created ON forms(created_at DESC);

-- 4. Row Level Security

-- Forms: leitura pública (para carregar o form na URL pública), escrita autenticada
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forms_public_read" ON forms
  FOR SELECT USING (true);

CREATE POLICY "forms_auth_insert" ON forms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "forms_auth_update" ON forms
  FOR UPDATE USING (true);

CREATE POLICY "forms_auth_delete" ON forms
  FOR DELETE USING (true);

-- Submissions: qualquer pessoa pode enviar (INSERT), leitura autenticada
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submissions_public_insert" ON submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "submissions_public_read" ON submissions
  FOR SELECT USING (true);

-- 5. Storage bucket para uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Política de upload: qualquer um pode fazer upload
CREATE POLICY "documents_public_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');

-- Política de leitura: qualquer um com o link pode ver
CREATE POLICY "documents_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

-- 6. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
