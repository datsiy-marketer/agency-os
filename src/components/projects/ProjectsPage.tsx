'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { useAppStore } from '@/lib/store'
import { DIVISION_MAP, PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS, BILLING_TYPE_LABELS } from '@/lib/constants'
import { formatCurrency } from '@/lib/billing'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Search, Plus, FolderKanban, Calendar, Pencil, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Project, ProjectStatus, Division, BillingType, ProjectType } from '@/types'

const statusFilters: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'planning', label: 'Планирование' },
  { value: 'paused', label: 'На паузе' },
  { value: 'completed', label: 'Завершённые' },
]

const divisionOptions: { value: Division; label: string }[] = [
  { value: 'ignite', label: 'Ignite' },
  { value: 'noise-dealers', label: 'Noise Dealers' },
  { value: 'other', label: 'Прочее' },
]

const billingOptions: { value: BillingType; label: string }[] = [
  { value: 'monthly', label: 'Ежемесячно' },
  { value: 'one-time', label: 'Разовый платёж' },
]

const typeOptions: { value: ProjectType; label: string }[] = [
  { value: 'real-estate', label: 'Недвижимость' },
  { value: 'event', label: 'Ивент' },
  { value: 'other', label: 'Прочее' },
]

const projectStatusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Активный' },
  { value: 'planning', label: 'Планирование' },
  { value: 'paused', label: 'На паузе' },
  { value: 'completed', label: 'Завершён' },
]

export function ProjectsPage() {
  const { projects, clients, tasks, updateProject, deleteProject } = useAppStore()
  const { data: session } = useSession()
  const isFounder = session?.user && (session.user as any).role === 'founder'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [divisionFilter, setDivisionFilter] = useState('all')

  // Edit dialog state
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [editForm, setEditForm] = useState<Partial<Project>>({})

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

  const filtered = projects.filter((p) => {
    const client = clients.find((c) => c.id === p.client_id)
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      client?.name.toLowerCase().includes(search.toLowerCase()) ||
      false
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    const matchesDivision = divisionFilter === 'all' || p.division === divisionFilter
    return matchesSearch && matchesStatus && matchesDivision
  })

  const totalMonthly = isFounder
    ? projects
        .filter((p) => p.status === 'active' && p.billing_type === 'monthly' && p.monthly_rate)
        .reduce((sum, p) => sum + (p.monthly_rate || 0), 0)
    : 0

  const openEdit = (p: Project) => {
    setEditProject(p)
    setEditForm({ ...p })
  }

  const handleEditSave = () => {
    if (!editProject) return
    updateProject(editProject.id, editForm)
    setEditProject(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteProject(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div>
      <TopBar
        title="Проекты"
        subtitle={`${projects.length} проектов · ${projects.filter((p) => p.status === 'active').length} активных`}
        actions={
          <Link href="/projects/new">
            <Button size="sm" className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              <Plus size={16} />
              Новый проект
            </Button>
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Top stats */}
        {isFounder && (
          <div className="grid grid-cols-4 gap-4">
            {['active', 'planning', 'paused', 'completed'].map((status) => {
              const count = projects.filter((p) => p.status === status).length
              const colors: Record<string, string> = {
                active: 'text-emerald-600',
                planning: 'text-blue-600',
                paused: 'text-yellow-600',
                completed: 'text-slate-500',
              }
              return (
                <Card key={status} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className={`text-2xl font-bold ${colors[status]}`}>{count}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{PROJECT_STATUS_LABELS[status]}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию или клиенту..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === f.value
                    ? 'bg-amber-500 text-black'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Division filter tabs */}
        <div className="flex gap-2">
          {['all', 'ignite', 'noise-dealers', 'other'].map((div) => {
            const label = div === 'all' ? 'Все дивизионы' : DIVISION_MAP[div]?.name || div
            const divConfig = div !== 'all' ? DIVISION_MAP[div] : null
            return (
              <button
                key={div}
                onClick={() => setDivisionFilter(div)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  divisionFilter === div
                    ? divConfig
                      ? `${divConfig.bgColor} ${divConfig.textColor} ${divConfig.borderColor}`
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    : 'bg-transparent text-muted-foreground border-transparent hover:border-border'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Projects */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FolderKanban size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">
              {projects.length === 0 ? 'Нет проектов' : 'Проекты не найдены'}
            </p>
            {projects.length === 0 && (
              <>
                <p className="text-sm mt-1">Создайте первый проект для начала работы</p>
                <Link href="/projects/new">
                  <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2">
                    <Plus size={16} />
                    Создать первый проект
                  </Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((project) => {
              const div = DIVISION_MAP[project.division]
              const client = clients.find((c) => c.id === project.client_id)
              const projectTasks = tasks.filter((t) => t.project_id === project.id)
              const doneTasks = projectTasks.filter((t) => t.status === 'done').length
              const taskProgress = projectTasks.length > 0
                ? Math.round((doneTasks / projectTasks.length) * 100)
                : 0

              return (
                <Card key={project.id} className="bg-card border-border hover:border-amber-500/30 transition-all hover:shadow-sm h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${div.bgColor} ${div.textColor} ${div.borderColor}`}>
                          {div.name}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${PROJECT_STATUS_COLORS[project.status]}`}>
                          {PROJECT_STATUS_LABELS[project.status]}
                        </span>
                      </div>
                      {isFounder && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => openEdit(project)}
                            className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(project)}
                            className="p-1.5 rounded hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    <Link href={`/projects/${project.id}`}>
                      <h3 className="font-semibold text-foreground hover:text-amber-600 transition-colors mb-1 line-clamp-2 cursor-pointer">
                        {project.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mb-3">{client?.name}</p>

                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}

                    {/* Task progress */}
                    {projectTasks.length > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Задачи</span>
                          <span>{doneTasks}/{projectTasks.length}</span>
                        </div>
                        <Progress value={taskProgress} className="h-1.5" />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar size={12} />
                        <span>{format(parseISO(project.start_date), 'd MMM yyyy')}</span>
                      </div>
                      {isFounder && (
                        <span className="text-sm font-semibold text-emerald-600">
                          {project.billing_type === 'monthly' && project.monthly_rate
                            ? `${formatCurrency(project.monthly_rate)}/мес`
                            : project.one_time_fee
                            ? formatCurrency(project.one_time_fee)
                            : ''}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {isFounder && totalMonthly > 0 && (
          <div className="flex justify-end">
            <div className="text-sm text-muted-foreground">
              Ежемесячная выручка (активные): <span className="text-emerald-600 font-semibold">{formatCurrency(totalMonthly)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editProject} onOpenChange={() => setEditProject(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактировать проект</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Название</Label>
              <Input
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Описание</Label>
              <Textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Статус</Label>
                <select
                  value={editForm.status || 'active'}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ProjectStatus })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                >
                  {projectStatusOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Дивизион</Label>
                <select
                  value={editForm.division || 'ignite'}
                  onChange={(e) => setEditForm({ ...editForm, division: e.target.value as Division })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                >
                  {divisionOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Тип оплаты</Label>
                <select
                  value={editForm.billing_type || 'monthly'}
                  onChange={(e) => setEditForm({ ...editForm, billing_type: e.target.value as BillingType })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                >
                  {billingOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {editForm.billing_type === 'monthly' ? (
                <div className="space-y-1.5">
                  <Label>Ставка в месяц (₽)</Label>
                  <Input
                    type="number"
                    value={editForm.monthly_rate || ''}
                    onChange={(e) => setEditForm({ ...editForm, monthly_rate: Number(e.target.value) })}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Сумма разовая (₽)</Label>
                  <Input
                    type="number"
                    value={editForm.one_time_fee || ''}
                    onChange={(e) => setEditForm({ ...editForm, one_time_fee: Number(e.target.value) })}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProject(null)}>Отмена</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" onClick={handleEditSave}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить проект?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Проект <span className="font-medium text-foreground">«{deleteTarget?.name}»</span> будет удалён. Это действие нельзя отменить.
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
