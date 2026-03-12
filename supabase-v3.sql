-- =============================================
-- LEGALFORMS v3 — Clients Table
-- Run in Supabase SQL Editor
-- =============================================

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  cpf TEXT,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  contact_name TEXT,
  notes TEXT,
  process_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_clients_cnpj ON clients(cnpj);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(process_status);

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on clients" ON clients FOR ALL USING (true) WITH CHECK (true);

-- Add client_id to submissions (links a submission to a client)
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- Add logo_url and cover_url to forms
ALTER TABLE forms ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS theme JSONB;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS settings JSONB;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE forms ADD COLUMN IF NOT EXISTS folder_id TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
