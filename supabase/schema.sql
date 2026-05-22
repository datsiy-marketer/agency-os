-- Agency OS Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DIVISIONS (static, managed via code)
-- ============================================================
-- Divisions are: 'ignite', 'noise-dealers', 'other'
-- Defined as constants in the codebase

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  division TEXT NOT NULL CHECK (division IN ('ignite', 'noise-dealers', 'other')),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  division TEXT NOT NULL CHECK (division IN ('ignite', 'noise-dealers', 'other')),
  type TEXT NOT NULL CHECK (type IN ('event', 'real-estate', 'other')),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('active', 'completed', 'paused', 'planning')),
  billing_type TEXT NOT NULL CHECK (billing_type IN ('monthly', 'one-time')),
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rate DECIMAL(12, 2),
  one_time_fee DECIMAL(12, 2),
  description TEXT,
  brief TEXT,
  kpis JSONB DEFAULT '[]'::jsonb,
  links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEES
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('piece-rate', 'fixed-salary')),
  fixed_salary DECIMAL(12, 2),
  email TEXT UNIQUE,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROJECT ASSIGNMENTS (who works on what)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  monthly_rate DECIMAL(12, 2),
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, employee_id)
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'review', 'done')),
  assignee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BILLING RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  billing_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  type TEXT NOT NULL DEFAULT 'regular' CHECK (type IN ('regular', 'pro-rated', 'one-time')),
  period_start DATE,
  period_end DATE,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SALARY RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS salary_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- format: 'YYYY-MM'
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  breakdown JSONB DEFAULT '[]'::jsonb,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, month)
);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  user_name TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_division ON projects(division);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project_id ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_employee_id ON project_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_project_id ON billing_records(project_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_status ON billing_records(status);
CREATE INDEX IF NOT EXISTS idx_salary_records_employee_id ON salary_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_month ON salary_records(month);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
-- For production, implement proper role-based RLS
CREATE POLICY "Allow all for authenticated users" ON clients FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON projects FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON employees FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON project_assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON tasks FOR ALL TO authenticated USING (true);
-- Billing and salaries: founder only (implement via Supabase roles)
CREATE POLICY "Allow all for authenticated users" ON billing_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON salary_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON activity_log FOR ALL TO authenticated USING (true);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_billing_records_updated_at BEFORE UPDATE ON billing_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA (optional, for testing)
-- ============================================================
-- Insert employees
INSERT INTO employees (name, role, type, fixed_salary, email, color) VALUES
  ('Алина', 'Project Manager', 'piece-rate', NULL, 'alina@agency-os.ru', '#f59e0b'),
  ('Даша', 'SMM & Content', 'piece-rate', NULL, 'dasha@agency-os.ru', '#8b5cf6'),
  ('Маша', 'Бизнес-ассистент', 'fixed-salary', 60000, 'masha@agency-os.ru', '#10b981')
ON CONFLICT (email) DO NOTHING;
