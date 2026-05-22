'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { useAppStore } from '@/lib/store'
import {
  DIVISION_MAP,
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
  BILLING_TYPE_LABELS,
  TASK_STATUS_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/lib/constants'
import { formatCurrency } from '@/lib/billing'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  FileText,
  Link2,
  Plus,
  Target,
  Pencil,
  Trash2,
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { useSession } from 'next-auth/react'
import type { TaskStatus, Task, KPI, ProjectLink } from '@/types'

interface Props {
  projectId: string
}

export function ProjectDetailPage({ projectId }: Props) {
  const { projects, clients, tasks, employees, assignments, billingRecords, updateTask, deleteTask, addTask, updateProject } = useAppStore()
  const router = useRouter()
  const { data: session } = useSession()
  const isFounder = session?.user && (session.user as any).role === 'founder'

  const project = projects.find((p) => p.id === projectId)
  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p>Проект не найден</p>
          <Link href="/projects" className="text-amber-500 text-sm mt-2 inline-block">← Назад</Link>
        </div>
      </div>
    )
  }

  const div = DIVISION_MAP[project.division]
  const client = clients.find((c) => c.id === project.client_id)
  const projectTasks = tasks.filter((t) => t.project_id === projectId)
  const projectAssignments = assignments.filter((a) => a.project_id === projectId)
  const projectBilling = billingRecords.filter((b) => b.project_id === projectId)

  const doneTasks = projectTasks.filter((t) => t.status === 'done').length
  const taskProgress = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0

  const daysActive = differenceInDays(new Date(), parseISO(project.start_date))

  const tasksByStatus: Record<TaskStatus, typeof projectTasks> = {
    todo: projectTasks.filter((t) => t.status === 'todo'),
    'in-progress': projectTasks.filter((t) => t.status === 'in-progress'),
    review: projectTasks.filter((t) => t.status === 'review'),
    done: projectTasks.filter((t) => t.status === 'done'),
  }

  const totalMonthlyStaff = projectAssignments.reduce((sum, a) => sum + (a.monthly_rate || 0), 0)
  const margin = project.monthly_rate
    ? Math.round(((project.monthly_rate - totalMonthlyStaff) / project.monthly_rate) * 100)
    : 0

  return (
    <ProjectDetailContent
      project={project}
      div={div}
      client={client}
      projectTasks={projectTasks}
      projectAssignments={projectAssignments}
      projectBilling={projectBilling}
      doneTasks={doneTasks}
      taskProgress={taskProgress}
      daysActive={daysActive}
      tasksByStatus={tasksByStatus}
      totalMonthlyStaff={totalMonthlyStaff}
      margin={margin}
      employees={employees}
      isFounder={!!isFounder}
      updateTask={updateTask}
      deleteTask={deleteTask}
      addTask={addTask}
      updateProject={updateProject}
      router={router}
      projectId={projectId}
    />
  )
}

function ProjectDetailContent({
  project,
  div,
  client,
  projectTasks,
  projectAssignments,
  projectBilling,
  doneTasks,
  taskProgress,
  daysActive,
  tasksByStatus,
  totalMonthlyStaff,
  margin,
  employees,
  isFounder,
  updateTask,
  deleteTask,
  addTask,
  updateProject,
  router,
  projectId,
}: any) {
  // Task dialog state
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editTaskForm, setEditTaskForm] = useState<Partial<Task>>({})
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<Task | null>(null)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee_id: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'todo' as TaskStatus,
  })

  // KPI dialog state
  const [editKpiOpen, setEditKpiOpen] = useState(false)
  const [editKpis, setEditKpis] = useState<KPI[]>(project.kpis)

  // Link dialog state
  const [editLinksOpen, setEditLinksOpen] = useState(false)
  const [editLinks, setEditLinks] = useState<ProjectLink[]>(project.links)

  const openEditTask = (task: Task) => {
    setEditTask(task)
    setEditTaskForm({ ...task })
  }

  const handleSaveTask = () => {
    if (!editTask) return
    updateTask(editTask.id, editTaskForm)
    setEditTask(null)
  }

  const handleDeleteTask = () => {
    if (!deleteTaskTarget) return
    deleteTask(deleteTaskTarget.id)
    setDeleteTaskTarget(null)
  }

  const handleAddTask = () => {
    const task: Task = {
      id: `task-${Date.now()}`,
      project_id: projectId,
      ...newTask,
      created_at: new Date().toISOString(),
    }
    addTask(task)
    setAddTaskOpen(false)
    setNewTask({ title: '', description: '', assignee_id: '', due_date: '', priority: 'medium', status: 'todo' })
  }

  const handleSaveKpis = () => {
    updateProject(project.id, { kpis: editKpis })
    setEditKpiOpen(false)
  }

  const handleSaveLinks = () => {
    updateProject(project.id, { links: editLinks })
    setEditLinksOpen(false)
  }

  return (
    <div>
      <TopBar
        title={project.name}
        subtitle={`${client?.name} · ${div.name}`}
        actions={
          <div className="flex gap-2">
            <span className={`text-xs px-3 py-1.5 rounded-full border ${PROJECT_STATUS_COLORS[project.status]}`}>
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Назад</span>
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className={`text-sm px-3 py-1 rounded-full border font-medium ${div.bgColor} ${div.textColor} ${div.borderColor}`}>
                {div.name}
              </span>
              <span className="text-sm text-muted-foreground">{client?.name}</span>
              {project.billing_type === 'monthly' && project.monthly_rate && isFounder && (
                <span className="text-sm font-semibold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  {formatCurrency(project.monthly_rate)}/мес
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          </div>

          {/* Quick stats */}
          <div className="flex gap-3 shrink-0">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-500">{daysActive}</div>
              <div className="text-xs text-muted-foreground">дней</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{taskProgress}%</div>
              <div className="text-xs text-muted-foreground">задач</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="tasks">
              Задачи
              {projectTasks.filter((t: Task) => t.status !== 'done').length > 0 && (
                <span className="ml-1.5 text-[10px] bg-amber-500/20 text-amber-600 rounded-full px-1.5 py-0.5">
                  {projectTasks.filter((t: Task) => t.status !== 'done').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="team">Команда</TabsTrigger>
            <TabsTrigger value="kpis">KPI</TabsTrigger>
            {isFounder && <TabsTrigger value="finance">Финансы</TabsTrigger>}
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText size={16} className="text-muted-foreground" />
                    Описание проекта
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.description ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Описание не заполнено</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText size={16} className="text-muted-foreground" />
                    Бриф для команды
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.brief ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">{project.brief}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Бриф не заполнен</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Key dates */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground" />
                  Ключевые даты
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Старт</div>
                    <div className="text-sm font-medium">{format(parseISO(project.start_date), 'd MMMM yyyy')}</div>
                  </div>
                  {project.end_date && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Завершение</div>
                      <div className="text-sm font-medium">{format(parseISO(project.end_date), 'd MMMM yyyy')}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Тип оплаты</div>
                    <div className="text-sm font-medium">{BILLING_TYPE_LABELS[project.billing_type]}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">В работе</div>
                    <div className="text-sm font-medium">{daysActive} дней</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Links */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Link2 size={16} className="text-muted-foreground" />
                    Ссылки и материалы
                  </CardTitle>
                  {isFounder && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1"
                      onClick={() => { setEditLinks([...project.links]); setEditLinksOpen(true) }}
                    >
                      <Pencil size={12} />
                      Редактировать
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {project.links.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Нет ссылок</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {project.links.map((link: ProjectLink) => {
                      const typeColors: Record<string, string> = {
                        brief: 'text-amber-500',
                        report: 'text-blue-500',
                        design: 'text-violet-500',
                        other: 'text-muted-foreground',
                      }
                      const typeLabels: Record<string, string> = {
                        brief: 'Бриф',
                        report: 'Отчёт',
                        design: 'Дизайн',
                        other: 'Ссылка',
                      }
                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors group"
                        >
                          <ExternalLink size={14} className={typeColors[link.type]} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate group-hover:text-amber-600 transition-colors">
                              {link.title}
                            </div>
                            <div className="text-xs text-muted-foreground">{typeLabels[link.type]}</div>
                          </div>
                          <ExternalLink size={12} className="text-muted-foreground/50 shrink-0" />
                        </a>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* KPI preview */}
            {project.kpis.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Target size={16} className="text-muted-foreground" />
                    KPI — краткий обзор
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {project.kpis.map((kpi: KPI) => {
                      const pct = Math.min(100, Math.round((kpi.current / kpi.target) * 100))
                      return (
                        <div key={kpi.id}>
                          <div className="text-xs text-muted-foreground mb-1 truncate">{kpi.name}</div>
                          <div className="text-lg font-bold text-foreground">
                            {kpi.current.toLocaleString()}{' '}
                            <span className="text-xs font-normal text-muted-foreground">{kpi.unit}</span>
                          </div>
                          <Progress value={pct} className="h-1 mt-1" />
                          <div className="text-[11px] text-muted-foreground mt-0.5">{pct}% от цели</div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tasks */}
          <TabsContent value="tasks" className="mt-6">
            <div className="mb-4 flex justify-end">
              <Button
                size="sm"
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                onClick={() => setAddTaskOpen(true)}
              >
                <Plus size={14} />
                Добавить задачу
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {(['todo', 'in-progress', 'review', 'done'] as TaskStatus[]).map((status) => {
                const statusTasks = tasksByStatus[status]
                const statusColors: Record<TaskStatus, string> = {
                  todo: 'border-slate-300 bg-slate-50',
                  'in-progress': 'border-amber-200 bg-amber-50/50',
                  review: 'border-violet-200 bg-violet-50/50',
                  done: 'border-emerald-200 bg-emerald-50/50',
                }
                const headerColors: Record<TaskStatus, string> = {
                  todo: 'text-slate-500',
                  'in-progress': 'text-amber-600',
                  review: 'text-violet-600',
                  done: 'text-emerald-600',
                }
                return (
                  <div key={status} className={`rounded-xl border p-4 ${statusColors[status]}`}>
                    <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${headerColors[status]}`}>
                      {TASK_STATUS_LABELS[status]} · {statusTasks.length}
                    </div>
                    <div className="space-y-2">
                      {statusTasks.map((task: Task) => {
                        const assignee = employees.find((e: any) => e.id === task.assignee_id)
                        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
                        return (
                          <div key={task.id} className="bg-card rounded-lg p-3 border border-border shadow-sm">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-xs font-medium text-foreground leading-tight line-clamp-2">
                                {task.title}
                              </p>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => openEditTask(task)}
                                  className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  onClick={() => setDeleteTaskTarget(task)}
                                  className="p-1 rounded hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                                >
                                  <Trash2 size={11} />
                                </button>
                                <button
                                  onClick={() => {
                                    const nextStatus: Record<TaskStatus, TaskStatus> = {
                                      todo: 'in-progress',
                                      'in-progress': 'review',
                                      review: 'done',
                                      done: 'todo',
                                    }
                                    updateTask(task.id, { status: nextStatus[task.status] })
                                  }}
                                  className="shrink-0"
                                >
                                  <CheckCircle2
                                    size={14}
                                    className={task.status === 'done' ? 'text-emerald-500' : 'text-muted-foreground/50 hover:text-muted-foreground'}
                                  />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              {assignee && (
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                                    style={{ backgroundColor: assignee.color }}
                                  >
                                    {assignee.name[0]}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">{assignee.name}</span>
                                </div>
                              )}
                              {task.due_date && (
                                <span className={`text-[10px] ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                                  {format(new Date(task.due_date), 'd MMM')}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {statusTasks.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-4 opacity-50">
                          Нет задач
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>

          {/* Team */}
          <TabsContent value="team" className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Команда проекта</CardTitle>
              </CardHeader>
              <CardContent>
                {projectAssignments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Users size={28} className="mx-auto mb-2 opacity-30" />
                    <p>Команда не назначена</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectAssignments.map((assignment: any) => {
                      const employee = employees.find((e: any) => e.id === assignment.employee_id)
                      if (!employee) return null
                      return (
                        <div key={assignment.id} className="flex items-center gap-4 p-4 rounded-xl bg-accent/50 border border-border">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                            style={{ backgroundColor: employee.color }}
                          >
                            {employee.name[0]}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{employee.name}</div>
                            <div className="text-sm text-muted-foreground">{assignment.role}</div>
                          </div>
                          {isFounder && assignment.monthly_rate && (
                            <div className="text-right shrink-0">
                              <div className="text-sm font-semibold text-emerald-600">
                                {formatCurrency(assignment.monthly_rate)}
                              </div>
                              <div className="text-xs text-muted-foreground">в месяц</div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {isFounder && projectAssignments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Расходы на команду</span>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(totalMonthlyStaff)}/мес</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* KPIs */}
          <TabsContent value="kpis" className="mt-6">
            <div className="mb-4 flex justify-end">
              {isFounder && (
                <Button
                  size="sm"
                  className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  onClick={() => { setEditKpis([...project.kpis]); setEditKpiOpen(true) }}
                >
                  <Pencil size={14} />
                  Редактировать KPI
                </Button>
              )}
            </div>
            {project.kpis.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="text-center py-16 text-muted-foreground">
                  <Target size={36} className="mx-auto mb-3 opacity-30" />
                  <p>KPI не заполнены</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.kpis.map((kpi: KPI) => {
                  const pct = Math.min(100, Math.round((kpi.current / kpi.target) * 100))
                  const isGood = pct >= 80
                  const isOk = pct >= 50
                  const barColor = isGood ? 'text-emerald-600' : isOk ? 'text-amber-600' : 'text-red-600'
                  return (
                    <Card key={kpi.id} className="bg-card border-border">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-foreground">{kpi.name}</div>
                          <span className={`text-sm font-bold ${barColor}`}>{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-2 mb-3" />
                        <div className="flex items-end justify-between">
                          <div>
                            <div className={`text-2xl font-bold ${barColor}`}>
                              {kpi.current.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Текущее значение · {kpi.unit}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-muted-foreground">
                              {kpi.target.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">Цель</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Finance - founder only */}
          {isFounder && (
            <TabsContent value="finance" className="mt-6 space-y-6">
              {/* Revenue summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">Ставка клиента</div>
                    <div className="text-xl font-bold text-emerald-600">
                      {project.billing_type === 'monthly' && project.monthly_rate
                        ? `${formatCurrency(project.monthly_rate)}/мес`
                        : project.one_time_fee
                        ? formatCurrency(project.one_time_fee)
                        : '—'}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">Расходы команды</div>
                    <div className="text-xl font-bold text-red-500">{formatCurrency(totalMonthlyStaff)}/мес</div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">Маржа</div>
                    <div className={`text-xl font-bold ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {margin}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Billing history */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard size={16} className="text-muted-foreground" />
                    История выставления счётов
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projectBilling.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Счёта не выставлялись</div>
                  ) : (
                    <div className="space-y-2">
                      {projectBilling.map((bill: any) => (
                        <div key={bill.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {formatCurrency(bill.amount)}
                              {bill.type === 'pro-rated' && (
                                <span className="ml-2 text-xs text-amber-600">(проразация)</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Выставлен {format(new Date(bill.billing_date), 'd MMM yyyy')}
                              {bill.period_start && ` · ${format(new Date(bill.period_start), 'MMM yyyy')}`}
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            bill.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              : bill.status === 'overdue'
                              ? 'bg-red-500/10 text-red-600 border-red-500/30'
                              : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
                          }`}>
                            {bill.status === 'paid' ? 'Оплачен' : bill.status === 'overdue' ? 'Просрочен' : 'Ожидается'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={!!editTask} onOpenChange={() => setEditTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать задачу</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Название</Label>
              <Input
                value={editTaskForm.title || ''}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Описание</Label>
              <Textarea
                value={editTaskForm.description || ''}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Исполнитель</Label>
                <select
                  value={editTaskForm.assignee_id || ''}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, assignee_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="">Не назначен</option>
                  {employees.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Срок</Label>
                <Input
                  type="date"
                  value={editTaskForm.due_date || ''}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Приоритет</Label>
                <select
                  value={editTaskForm.priority || 'medium'}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Статус</Label>
                <select
                  value={editTaskForm.status || 'todo'}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value as TaskStatus })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="todo">К выполнению</option>
                  <option value="in-progress">В работе</option>
                  <option value="review">На проверке</option>
                  <option value="done">Готово</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTask(null)}>Отмена</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" onClick={handleSaveTask}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Task Dialog */}
      <Dialog open={!!deleteTaskTarget} onOpenChange={() => setDeleteTaskTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить задачу?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Задача <span className="font-medium text-foreground">«{deleteTaskTarget?.title}»</span> будет удалена. Это действие нельзя отменить.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTaskTarget(null)}>Отмена</Button>
            <Button variant="destructive" onClick={handleDeleteTask}>Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить задачу</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Название *</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Название задачи"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Описание</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={2}
                placeholder="Описание задачи..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Исполнитель</Label>
                <select
                  value={newTask.assignee_id}
                  onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="">Не назначен</option>
                  {employees.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Срок</Label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Приоритет</Label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Статус</Label>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value as TaskStatus })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="todo">К выполнению</option>
                  <option value="in-progress">В работе</option>
                  <option value="review">На проверке</option>
                  <option value="done">Готово</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTaskOpen(false)}>Отмена</Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              onClick={handleAddTask}
              disabled={!newTask.title}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit KPI Dialog */}
      <Dialog open={editKpiOpen} onOpenChange={setEditKpiOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактировать KPI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-96 overflow-y-auto">
            {editKpis.map((kpi, idx) => (
              <div key={kpi.id} className="p-3 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">KPI #{idx + 1}</span>
                  <button
                    onClick={() => setEditKpis(editKpis.filter((_, i) => i !== idx))}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Удалить
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Название</Label>
                    <Input
                      value={kpi.name}
                      onChange={(e) => {
                        const updated = [...editKpis]
                        updated[idx] = { ...updated[idx], name: e.target.value }
                        setEditKpis(updated)
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Единица</Label>
                    <Input
                      value={kpi.unit}
                      onChange={(e) => {
                        const updated = [...editKpis]
                        updated[idx] = { ...updated[idx], unit: e.target.value }
                        setEditKpis(updated)
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Цель</Label>
                    <Input
                      type="number"
                      value={kpi.target}
                      onChange={(e) => {
                        const updated = [...editKpis]
                        updated[idx] = { ...updated[idx], target: Number(e.target.value) }
                        setEditKpis(updated)
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Текущее</Label>
                    <Input
                      type="number"
                      value={kpi.current}
                      onChange={(e) => {
                        const updated = [...editKpis]
                        updated[idx] = { ...updated[idx], current: Number(e.target.value) }
                        setEditKpis(updated)
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setEditKpis([...editKpis, { id: `kpi-${Date.now()}`, name: '', target: 0, current: 0, unit: '' }])}
            >
              <Plus size={14} />
              Добавить KPI
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditKpiOpen(false)}>Отмена</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" onClick={handleSaveKpis}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Links Dialog */}
      <Dialog open={editLinksOpen} onOpenChange={setEditLinksOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ссылки и материалы</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-80 overflow-y-auto">
            {editLinks.map((link, idx) => (
              <div key={link.id} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Название"
                    value={link.title}
                    onChange={(e) => {
                      const updated = [...editLinks]
                      updated[idx] = { ...updated[idx], title: e.target.value }
                      setEditLinks(updated)
                    }}
                  />
                  <Input
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => {
                      const updated = [...editLinks]
                      updated[idx] = { ...updated[idx], url: e.target.value }
                      setEditLinks(updated)
                    }}
                  />
                  <select
                    value={link.type}
                    onChange={(e) => {
                      const updated = [...editLinks]
                      updated[idx] = { ...updated[idx], type: e.target.value as ProjectLink['type'] }
                      setEditLinks(updated)
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  >
                    <option value="brief">Бриф</option>
                    <option value="report">Отчёт</option>
                    <option value="design">Дизайн</option>
                    <option value="other">Прочее</option>
                  </select>
                </div>
                <button
                  onClick={() => setEditLinks(editLinks.filter((_, i) => i !== idx))}
                  className="mt-1 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setEditLinks([...editLinks, { id: `link-${Date.now()}`, title: '', url: '', type: 'other' }])}
            >
              <Plus size={14} />
              Добавить ссылку
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLinksOpen(false)}>Отмена</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" onClick={handleSaveLinks}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
