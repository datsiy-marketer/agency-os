'use client'

import { useAppStore } from '@/lib/store'
import { formatCurrency } from '@/lib/billing'
import { DIVISION_MAP, PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '@/lib/constants'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  Users,
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Music2,
  Layers,
  CreditCard,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { useSession } from 'next-auth/react'

export function DashboardPage() {
  const { projects, clients, tasks, billingRecords, employees, assignments } = useAppStore()
  const { data: session } = useSession()
  const isFounder = session?.user && (session.user as any).role === 'founder'

  const activeProjects = projects.filter((p) => p.status === 'active')

  // Revenue this month (paid bills in current month)
  const now = new Date()
  const currentMonth = format(now, 'yyyy-MM')
  const paidThisMonth = billingRecords
    .filter((b) => b.status === 'paid' && b.billing_date.startsWith(currentMonth))
    .reduce((sum, b) => sum + b.amount, 0)

  const pendingRevenue = billingRecords
    .filter((b) => b.status === 'pending')
    .reduce((sum, b) => sum + b.amount, 0)

  // Overdue tasks
  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'done' || !t.due_date) return false
    return new Date(t.due_date) < now
  })

  // Upcoming tasks (next 7 days)
  const upcomingTasks = tasks.filter((t) => {
    if (t.status === 'done' || !t.due_date) return false
    const due = new Date(t.due_date)
    const daysUntil = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return daysUntil >= 0 && daysUntil <= 7
  })

  // Projects by division
  const byDivision = {
    ignite: activeProjects.filter((p) => p.division === 'ignite'),
    'noise-dealers': activeProjects.filter((p) => p.division === 'noise-dealers'),
    other: activeProjects.filter((p) => p.division === 'other'),
  }

  // Employee workload
  const employeeWorkload = employees.map((emp) => {
    const empAssignments = assignments.filter((a) => a.employee_id === emp.id)
    const activeAssignments = empAssignments.filter((a) => {
      const proj = projects.find((p) => p.id === a.project_id)
      return proj && proj.status === 'active'
    })
    const monthlyEarnings = activeAssignments.reduce((sum, a) => sum + (a.monthly_rate || 0), 0)
    return { employee: emp, projectCount: activeAssignments.length, monthlyEarnings }
  })

  // Empty state — no data at all
  const isEmpty = projects.length === 0 && clients.length === 0 && employees.length === 0

  return (
    <div>
      <TopBar title="Дашборд" subtitle="Обзор агентства в реальном времени" />

      <div className="p-6 space-y-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
              <FolderKanban size={32} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Добро пожаловать в Agency OS!</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Начните с добавления клиентов и проектов, чтобы дашборд ожил.
            </p>
            <div className="flex gap-3">
              <Link
                href="/clients/new"
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg text-sm transition-colors"
              >
                <Plus size={16} />
                Добавить клиента
              </Link>
              <Link
                href="/staff"
                className="flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-accent text-foreground rounded-lg text-sm transition-colors"
              >
                <Users size={16} />
                Добавить сотрудника
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                      <FolderKanban size={18} className="text-amber-500" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-foreground">{activeProjects.length}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">Активных проектов</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
                      <Users size={18} className="text-blue-500" />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{clients.filter((c) => c.status === 'active').length} активных</span>
                  </div>
                  <div className="text-3xl font-bold text-foreground">{clients.length}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">Клиентов всего</div>
                </CardContent>
              </Card>

              {isFounder && (
                <>
                  <Card className="bg-card border-border">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                          <CreditCard size={18} className="text-emerald-500" />
                        </div>
                        <span className="text-[11px] text-muted-foreground">этот месяц</span>
                      </div>
                      <div className="text-3xl font-bold text-foreground">
                        {formatCurrency(paidThisMonth || pendingRevenue)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {paidThisMonth > 0 ? 'Оплачено' : 'Ожидается'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center">
                          <AlertTriangle size={18} className="text-red-500" />
                        </div>
                        {overdueTasks.length > 0 && (
                          <span className="text-[11px] text-red-500 font-medium">Требует внимания</span>
                        )}
                      </div>
                      <div className="text-3xl font-bold text-foreground">{overdueTasks.length}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">Просроченных задач</div>
                    </CardContent>
                  </Card>
                </>
              )}

              {!isFounder && (
                <>
                  <Card className="bg-card border-border">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
                          <CheckCircle2 size={18} className="text-violet-500" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-foreground">
                        {tasks.filter((t) => t.status === 'done').length}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">Задач выполнено</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center">
                          <AlertTriangle size={18} className="text-red-500" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-foreground">{overdueTasks.length}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">Просроченных задач</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Division breakdown */}
              <Card className="bg-card border-border lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">По дивизионам</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(byDivision).map(([divId, divProjects]) => {
                    const div = DIVISION_MAP[divId]
                    const icons = { ignite: Flame, 'noise-dealers': Music2, other: Layers }
                    const Icon = icons[divId as keyof typeof icons]
                    const percentage = activeProjects.length > 0
                      ? Math.round((divProjects.length / activeProjects.length) * 100)
                      : 0
                    return (
                      <div key={divId}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Icon size={14} className={div.textColor} />
                            <span className="text-sm font-medium text-foreground">{div.name}</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">{divProjects.length}</span>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                        <div className="flex justify-between mt-1">
                          <span className="text-[11px] text-muted-foreground">{div.description}</span>
                          <span className="text-[11px] text-muted-foreground">{percentage}%</span>
                        </div>
                      </div>
                    )
                  })}

                  <div className="pt-2 border-t border-border">
                    <Link href="/projects" className="flex items-center gap-1.5 text-sm text-amber-500 hover:text-amber-600 transition-colors">
                      <span>Все проекты</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Active projects list */}
              <Card className="bg-card border-border lg:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Активные проекты</CardTitle>
                    <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Все →
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeProjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <FolderKanban size={28} className="mx-auto mb-2 opacity-30" />
                      <p>Нет активных проектов</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeProjects.slice(0, 5).map((project) => {
                        const div = DIVISION_MAP[project.division]
                        const client = clients.find((c) => c.id === project.client_id)
                        const projectTasks = tasks.filter((t) => t.project_id === project.id)
                        const doneTasks = projectTasks.filter((t) => t.status === 'done').length
                        const taskProgress = projectTasks.length > 0
                          ? Math.round((doneTasks / projectTasks.length) * 100)
                          : 0

                        return (
                          <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                          >
                            <div className={`w-2 h-2 rounded-full ${div.textColor.replace('text-', 'bg-')}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground truncate group-hover:text-amber-500 transition-colors">
                                  {project.name}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${div.bgColor} ${div.textColor} ${div.borderColor} shrink-0`}>
                                  {div.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">{client?.name}</span>
                                {projectTasks.length > 0 && (
                                  <div className="flex items-center gap-1.5 flex-1">
                                    <Progress value={taskProgress} className="h-1 flex-1 max-w-24" />
                                    <span className="text-[11px] text-muted-foreground">{taskProgress}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {isFounder && project.billing_type === 'monthly' && project.monthly_rate && (
                              <span className="text-sm font-semibold text-emerald-600 shrink-0">
                                {formatCurrency(project.monthly_rate)}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Team workload - founder only */}
              {isFounder && employees.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Нагрузка команды</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {employeeWorkload.map(({ employee, projectCount, monthlyEarnings }) => (
                      <div key={employee.id} className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: employee.color }}
                        >
                          {employee.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{employee.name}</span>
                            <span className="text-xs font-semibold text-emerald-600">
                              {formatCurrency(employee.type === 'fixed-salary' ? (employee.fixed_salary || 0) : monthlyEarnings)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{employee.role}</span>
                            {employee.type === 'piece-rate' && (
                              <span className="text-[11px] text-muted-foreground">· {projectCount} проектов</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 border-t border-border">
                      <Link href="/staff" className="flex items-center gap-1.5 text-sm text-amber-500 hover:text-amber-600 transition-colors">
                        <span>Управление командой</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upcoming / overdue tasks */}
              <Card className={`bg-card border-border ${isFounder && employees.length > 0 ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {overdueTasks.length > 0 ? (
                        <span className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-red-500" />
                          Просроченные задачи
                        </span>
                      ) : (
                        'Задачи на неделе'
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {overdueTasks.length > 0 ? (
                    <div className="space-y-2">
                      {overdueTasks.slice(0, 5).map((task) => {
                        const project = projects.find((p) => p.id === task.project_id)
                        const assignee = employees.find((e) => e.id === task.assignee_id)
                        return (
                          <div key={task.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-red-50 border border-red-200">
                            <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{task.title}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-muted-foreground truncate">{project?.name}</span>
                                {assignee && (
                                  <span className="text-xs text-red-500">· {assignee.name}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-red-500 shrink-0">
                              {task.due_date ? format(new Date(task.due_date), 'd MMM') : ''}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcomingTasks.slice(0, 5).map((task) => {
                        const project = projects.find((p) => p.id === task.project_id)
                        return (
                          <div key={task.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors">
                            <Clock size={14} className="text-amber-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{task.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{project?.name}</div>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {task.due_date ? format(new Date(task.due_date), 'd MMM') : ''}
                            </span>
                          </div>
                        )
                      })}
                      {upcomingTasks.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                          Нет задач на ближайшие 7 дней
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent activity placeholder */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Последние события</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    <TrendingUp size={24} className="mx-auto mb-2 opacity-30" />
                    <p>События появятся по мере работы</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
