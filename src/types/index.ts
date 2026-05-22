export type Division = 'ignite' | 'noise-dealers' | 'other'

export type ProjectType = 'event' | 'real-estate' | 'other'

export type BillingType = 'monthly' | 'one-time'

export type ProjectStatus = 'active' | 'completed' | 'paused' | 'planning'

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done'

export type EmployeeType = 'piece-rate' | 'fixed-salary'

export type UserRole = 'founder' | 'employee'

export interface DivisionConfig {
  id: Division
  name: string
  color: string
  bgColor: string
  textColor: string
  borderColor: string
  description: string
}

export interface Client {
  id: string
  name: string
  division: Division
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  status: 'active' | 'inactive'
  created_at: string
  notes?: string
}

export interface KPI {
  id: string
  name: string
  target: number
  current: number
  unit: string
}

export interface ProjectLink {
  id: string
  title: string
  url: string
  type: 'brief' | 'report' | 'design' | 'other'
}

export interface Project {
  id: string
  name: string
  client_id: string
  division: Division
  type: ProjectType
  status: ProjectStatus
  billing_type: BillingType
  start_date: string
  end_date?: string
  monthly_rate?: number
  one_time_fee?: number
  description?: string
  brief?: string
  kpis: KPI[]
  links: ProjectLink[]
  created_at: string
}

export interface Employee {
  id: string
  name: string
  role: string
  type: EmployeeType
  fixed_salary?: number
  email?: string
  avatar?: string
  color: string
}

export interface ProjectAssignment {
  id: string
  project_id: string
  employee_id: string
  role: string
  monthly_rate?: number
  start_date: string
  end_date?: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description?: string
  status: TaskStatus
  assignee_id?: string
  due_date?: string
  created_at: string
  priority: 'low' | 'medium' | 'high'
}

export interface BillingRecord {
  id: string
  project_id: string
  amount: number
  billing_date: string
  due_date: string
  status: 'pending' | 'paid' | 'overdue'
  type: 'regular' | 'pro-rated' | 'one-time'
  period_start?: string
  period_end?: string
  notes?: string
}

export interface SalaryRecord {
  id: string
  employee_id: string
  month: string
  amount: number
  status: 'pending' | 'paid'
  paid_at?: string
  breakdown: SalaryBreakdown[]
}

export interface SalaryBreakdown {
  project_id: string
  project_name: string
  days_worked: number
  days_in_month: number
  monthly_rate: number
  amount: number
  pro_rated: boolean
}

export interface ActivityItem {
  id: string
  type: 'project_created' | 'task_completed' | 'client_added' | 'billing_sent' | 'salary_paid'
  title: string
  description: string
  timestamp: string
  user?: string
  project_id?: string
  client_id?: string
}
