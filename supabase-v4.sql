-- =============================================
-- LEGALFORMS v4 — Expand Clients Table
-- Run in Supabase SQL Editor
-- =============================================

-- Company data from CNPJ lookup
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cnae_fiscal TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS situacao_cadastral TEXT;

-- Full address
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS logradouro TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS uf TEXT;
