-- =============================================
-- LEGALFORMS v6 — Process Templates + Processes + Events
-- Run in Supabase SQL Editor
-- =============================================

-- 1. Process Templates (reusable models)
CREATE TABLE IF NOT EXISTS process_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  color TEXT DEFAULT '#FF6100',
  stages JSONB NOT NULL DEFAULT '["Coleta de docs","Análise","Protocolo","Concluído"]',
  documents JSONB DEFAULT '[]',
  form_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE process_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on process_templates" ON process_templates FOR ALL USING (true) WITH CHECK (true);

-- 2. Processes (instances)
CREATE TABLE IF NOT EXISTS processes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES process_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  current_stage INT DEFAULT 0,
  stages JSONB NOT NULL DEFAULT '[]',
  priority TEXT DEFAULT 'normal',
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  deadline DATE,
  notes TEXT,
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processes_client ON processes(client_id);
CREATE INDEX IF NOT EXISTS idx_processes_company ON processes(company_id);
CREATE INDEX IF NOT EXISTS idx_processes_template ON processes(template_id);

ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on processes" ON processes FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER processes_updated_at
  BEFORE UPDATE ON processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Process Events (timeline)
CREATE TABLE IF NOT EXISTS process_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'note',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pevents_process ON process_events(process_id);

ALTER TABLE process_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on process_events" ON process_events FOR ALL USING (true) WITH CHECK (true);
