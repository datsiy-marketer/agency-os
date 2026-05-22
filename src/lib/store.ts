'use client'

import { create } from 'zustand'
import type { Client, Project, Employee, ProjectAssignment, Task, BillingRecord } from '@/types'

interface AppState {
  clients: Client[]
  projects: Project[]
  employees: Employee[]
  assignments: ProjectAssignment[]
  tasks: Task[]
  billingRecords: BillingRecord[]

  // Actions
  addClient: (client: Client) => void
  updateClient: (id: string, data: Partial<Client>) => void
  deleteClient: (id: string) => void
  addProject: (project: Project) => void
  updateProject: (id: string, data: Partial<Project>) => void
  deleteProject: (id: string) => void
  addTask: (task: Task) => void
  updateTask: (id: string, data: Partial<Task>) => void
  deleteTask: (id: string) => void
  addAssignment: (assignment: ProjectAssignment) => void
  addEmployee: (employee: Employee) => void
  updateEmployee: (id: string, data: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  clients: [],
  projects: [],
  employees: [],
  assignments: [],
  tasks: [],
  billingRecords: [],

  addClient: (client) =>
    set((state) => ({ clients: [...state.clients, client] })),

  updateClient: (id, data) =>
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),

  deleteClient: (id) =>
    set((state) => ({ clients: state.clients.filter((c) => c.id !== id) })),

  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),

  updateProject: (id, data) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),

  deleteProject: (id) =>
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

  addTask: (task) =>
    set((state) => ({ tasks: [...state.tasks, task] })),

  updateTask: (id, data) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),

  deleteTask: (id) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

  addAssignment: (assignment) =>
    set((state) => ({ assignments: [...state.assignments, assignment] })),

  addEmployee: (employee) =>
    set((state) => ({ employees: [...state.employees, employee] })),

  updateEmployee: (id, data) =>
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, ...data } : e)),
    })),

  deleteEmployee: (id) =>
    set((state) => ({ employees: state.employees.filter((e) => e.id !== id) })),
}))
