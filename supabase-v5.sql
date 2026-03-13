-- =============================================
-- LEGALFORMS v5 — Companies + Client-Company Links
-- Run in Supabase SQL Editor
-- =============================================

-- 1. Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT NOT NULL,
  cnae_fiscal TEXT,
  situacao_cadastral TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);

-- 2. Client-Company link table (N:N)
CREATE TABLE IF NOT EXISTS client_companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'responsavel',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_cc_client ON client_companies(client_id);
CREATE INDEX IF NOT EXISTS idx_cc_company ON client_companies(company_id);

-- 3. RLS for companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on companies" ON companies FOR ALL USING (true) WITH CHECK (true);

-- 4. RLS for client_companies
ALTER TABLE client_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on client_companies" ON client_companies FOR ALL USING (true) WITH CHECK (true);

-- 5. Auto-update trigger for companies
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Clean up old company fields from clients (optional, keeps backward compat)
-- ALTER TABLE clients DROP COLUMN IF EXISTS cnpj;
-- ALTER TABLE clients DROP COLUMN IF EXISTS nome_fantasia;
-- ALTER TABLE clients DROP COLUMN IF EXISTS cnae_fiscal;
-- ALTER TABLE clients DROP COLUMN IF EXISTS situacao_cadastral;
