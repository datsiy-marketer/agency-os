'use client'

import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { useAppStore } from '@/lib/store'
import { formatCurrency } from '@/lib/billing'
import { DIVISION_MAP } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { FolderKanban, AlertTriangle, Plus, Pencil, Trash2, UserCircle } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import type { Employee } from '@/types'

const COLORS = ['#f59e0b', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444', '#ec4899']
const DIVISION_OPTIONS = [
  { value: 'ignite', label: 'Ignite' },
  { value: 'noise-dealers', label: 'Noise Dealers' },
  { value: 'other', label: 'Прочее' },
]

export function StaffPage() {
  const { employees, assignments, projects, tasks, addEmployee, updateEmployee, deleteEmployee } = useAppStore()
  const { data: session } = useSession()
  const isFounder = session?.user && (session.user as any).role === 'founder'

  // Add employee dialog
  const [addOpen, setAddOpen] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    role: '',
    type: 'piece-rate' as 'piece-rate' | 'fixed-salary',
    fixed_salary: '',
    email: '',
    color: COLORS[0],
    // Login info
    username: '',
    password: '',
    allowedDivisions: [] as string[],
  })

  // Edit employee dialog
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [editForm, setEditForm] = useState<Partial<Employee>>({})

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)

  const handleAddEmployee = async () => {
    const employee: Employee = {
      id: `emp-${Date.now()}`,
      name: newEmployee.name,
      role: newEmployee.role,
      type: newEmployee.type,
      fixed_salary: newEmployee.type === 'fixed-salary' ? Number(newEmployee.fixed_salary) : undefined,
      email: newEmployee.email,
      color: newEmployee.color,
    }
    addEmployee(employee)

    // Create login account if username/password provided and user is founder
    if (isFounder && newEmployee.username && newEmployee.password) {
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: newEmployee.username,
            password: newEmployee.password,
            name: newEmployee.name,
            employeeId: employee.id,
            allowedDivisions: newEmployee.allowedDivisions,
          }),
        })
      } catch (e) {
        console.error('Failed to create user account', e)
      }
    }

    setAddOpen(false)
    setNewEmployee({
      name: '', role: '', type: 'piece-rate', fixed_salary: '', email: '',
      color: COLORS[0], username: '', password: '', allowedDivisions: [],
    })
  }

  const openEdit = (emp: Employee) => {
    setEditEmployee(emp)
    setEditForm({ ...emp })
  }

  const handleEditSave = () => {
    if (!editEmployee) return
    updateEmployee(editEmployee.id, editForm)
    setEditEmployee(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteEmployee(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div>
      <TopBar
        title="Команда"
        subtitle="Сотрудники и нагрузка"
        actions={
          isFounder ? (
            <Button
              size="sm"
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              onClick={() => setAddOpen(true)}
            >
              <Plus size={16} />
              Добавить сотрудника
            </Button>
          ) : undefined
        }
      />

      <div className="p-6 space-y-6">
        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
              <UserCircle size={32} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Нет сотрудников</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Добавьте первого сотрудника в команду агентства
            </p>
            {isFounder && (
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2"
                onClick={() => setAddOpen(true)}
              >
                <Plus size={16} />
                Добавить первого сотрудника
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {employees.map((employee) => {
              const empAssignments = assignments.filter((a) => a.employee_id === employee.id)
              const activeAssignments = empAssignments.filter((a) => {
                const proj = projects.find((p) => p.id === a.project_id)
                return proj && proj.status === 'active'
              })

              const empTasks = tasks.filter((t) => t.assignee_id === employee.id)
              const doneTasks = empTasks.filter((t) => t.status === 'done')
              const inProgressTasks = empTasks.filter((t) => t.status === 'in-progress')
              const overdueTasks = empTasks.filter((t) => {
                if (t.status === 'done' || !t.due_date) return false
                return new Date(t.due_date) < new Date()
              })

              const monthlyEarnings = employee.type === 'fixed-salary'
                ? (employee.fixed_salary || 0)
                : activeAssignments.reduce((sum, a) => sum + (a.monthly_rate || 0), 0)

              const taskCompletion = empTasks.length > 0
                ? Math.round((doneTasks.length / empTasks.length) * 100)
                : 0

              return (
                <Card key={employee.id} className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
                        style={{ backgroundColor: employee.color }}
                      >
                        {employee.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-foreground">{employee.name}</h3>
                        <p className="text-sm text-muted-foreground">{employee.role}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            employee.type === 'piece-rate'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                          }`}>
                            {employee.type === 'piece-rate' ? 'Сдельно' : 'Фикс. оклад'}
                          </span>
                        </div>
                      </div>
                      {isFounder && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => openEdit(employee)}
                            className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(employee)}
                            className="p-1.5 rounded hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Salary - founder only */}
                    {isFounder && (
                      <div className="p-3 rounded-lg bg-accent/50 border border-border">
                        <div className="text-xs text-muted-foreground mb-1">
                          {employee.type === 'piece-rate' ? 'Ставка за проекты (в месяц)' : 'Фиксированный оклад'}
                        </div>
                        <div className="text-xl font-bold text-emerald-600">{formatCurrency(monthlyEarnings)}</div>
                        {employee.type === 'piece-rate' && (
                          <div className="text-xs text-muted-foreground mt-0.5">{activeAssignments.length} активных проектов</div>
                        )}
                      </div>
                    )}

                    {/* Task stats */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Завершённость задач</span>
                        <span>{taskCompletion}%</span>
                      </div>
                      <Progress value={taskCompletion} className="h-2" />
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-foreground">{inProgressTasks.length}</div>
                          <div className="text-[10px] text-muted-foreground">В работе</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-foreground">{doneTasks.length}</div>
                          <div className="text-[10px] text-muted-foreground">Завершено</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${overdueTasks.length > 0 ? 'text-red-500' : 'text-foreground'}`}>
                            {overdueTasks.length}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Просроч.</div>
                        </div>
                      </div>
                    </div>

                    {/* Active projects */}
                    {activeAssignments.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Активные проекты
                        </div>
                        <div className="space-y-1.5">
                          {activeAssignments.map((assignment) => {
                            const proj = projects.find((p) => p.id === assignment.project_id)
                            if (!proj) return null
                            const div = DIVISION_MAP[proj.division]
                            return (
                              <Link key={assignment.id} href={`/projects/${proj.id}`}>
                                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors">
                                  <div className={`w-1.5 h-1.5 rounded-full ${div.textColor.replace('text-', 'bg-')}`} />
                                  <span className="text-xs text-foreground truncate flex-1 hover:text-amber-600 transition-colors">
                                    {proj.name}
                                  </span>
                                  {isFounder && assignment.monthly_rate && (
                                    <span className="text-xs text-muted-foreground shrink-0">
                                      {formatCurrency(assignment.monthly_rate)}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Overdue tasks */}
                    {overdueTasks.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <AlertTriangle size={12} />
                          Просроченные задачи
                        </div>
                        <div className="space-y-1">
                          {overdueTasks.slice(0, 3).map((task) => (
                            <div key={task.id} className="text-xs p-2 rounded bg-red-50 border border-red-200 text-red-600 truncate">
                              {task.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Добавить сотрудника</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Имя *</Label>
                <Input
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="Имя сотрудника"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Должность *</Label>
                <Input
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  placeholder="Project Manager"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                placeholder="email@example.ru"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Тип оплаты</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewEmployee({ ...newEmployee, type: 'piece-rate' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    newEmployee.type === 'piece-rate'
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Сдельно
                </button>
                <button
                  type="button"
                  onClick={() => setNewEmployee({ ...newEmployee, type: 'fixed-salary' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    newEmployee.type === 'fixed-salary'
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Фикс. оклад
                </button>
              </div>
            </div>

            {newEmployee.type === 'fixed-salary' && (
              <div className="space-y-1.5">
                <Label>Оклад (₽/мес)</Label>
                <Input
                  type="number"
                  value={newEmployee.fixed_salary}
                  onChange={(e) => setNewEmployee({ ...newEmployee, fixed_salary: e.target.value })}
                  placeholder="60000"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Цвет аватара</Label>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewEmployee({ ...newEmployee, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newEmployee.color === color ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="text-sm font-semibold text-foreground mb-3">Данные для входа (опционально)</div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Логин</Label>
                  <Input
                    value={newEmployee.username}
                    onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })}
                    placeholder="username"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Пароль</Label>
                  <Input
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    placeholder="Начальный пароль"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Доступ к дивизионам</Label>
                  <div className="flex gap-2 flex-wrap">
                    {DIVISION_OPTIONS.map((div) => (
                      <button
                        key={div.value}
                        type="button"
                        onClick={() => {
                          const current = newEmployee.allowedDivisions
                          const updated = current.includes(div.value)
                            ? current.filter((d) => d !== div.value)
                            : [...current, div.value]
                          setNewEmployee({ ...newEmployee, allowedDivisions: updated })
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          newEmployee.allowedDivisions.includes(div.value)
                            ? 'bg-amber-500 text-black border-amber-500'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {div.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Пусто = доступ ко всем дивизионам</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Отмена</Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              onClick={handleAddEmployee}
              disabled={!newEmployee.name || !newEmployee.role}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={!!editEmployee} onOpenChange={() => setEditEmployee(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать сотрудника</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Имя</Label>
                <Input
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Должность</Label>
                <Input
                  value={editForm.role || ''}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Тип оплаты</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, type: 'piece-rate' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    editForm.type === 'piece-rate'
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Сдельно
                </button>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, type: 'fixed-salary' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    editForm.type === 'fixed-salary'
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Фикс. оклад
                </button>
              </div>
            </div>
            {editForm.type === 'fixed-salary' && (
              <div className="space-y-1.5">
                <Label>Оклад (₽/мес)</Label>
                <Input
                  type="number"
                  value={editForm.fixed_salary || ''}
                  onChange={(e) => setEditForm({ ...editForm, fixed_salary: Number(e.target.value) })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmployee(null)}>Отмена</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" onClick={handleEditSave}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить сотрудника?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Сотрудник <span className="font-medium text-foreground">«{deleteTarget?.name}»</span> будет удалён. Это действие нельзя отменить.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete}>Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
