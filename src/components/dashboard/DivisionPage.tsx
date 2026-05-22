'use client'

import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { useAppStore } from '@/lib/store'
import { DIVISION_MAP, PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '@/lib/constants'
import { formatCurrency } from '@/lib/billing'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { FolderKanban, Users, Plus, Target, TrendingUp, Flame, Music2, Layers } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useSession } from 'next-auth/react'
import type { Division } from '@/types'

interface Props {
  slug: string
}

const divisionIcons = {
  ignite: Flame,
  'noise-dealers': Music2,
  other: Layers,
}

export function DivisionPage({ slug }: Props) {
  const { projects, clients, tasks, assignments, employees, billingRecords } = useAppStore()
  const { data: session } = useSession()
  const isFounder = session?.user && (session.user as any).role === 'founder'

  const division = DIVISION_MAP[slug]
  if (!division) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Дивизион не найден</p>
      </div>
    )
  }

  const Icon = divisionIcons[slug as keyof typeof divisionIcons] || Layers
  const divisionProjects = projects.filter((p) => p.division === slug)
  const activeProjects = divisionProjects.filter((p) => p.status === 'active')
  const divisionClients = clients.filter((c) => c.division === slug)

  const monthlyRevenue = isFounder
    ? activeProjects
        .filter((p) => p.billing_type === 'monthly' && p.monthly_rate)
        .reduce((sum, p) => sum + (p.monthly_rate || 0), 0)
    : 0

  const allTasks = divisionProjects.flatMap((p) => tasks.filter((t) => t.project_id === p.id))
  const doneTasks = allTasks.filter((t) => t.status === 'done').length
  const taskProgress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0

  const involvedEmployees = new Set(
    assignments
      .filter((a) => activeProjects.some((p) => p.id === a.project_id))
      .map((a) => a.employee_id)
  )

  return (
    <div>
      <TopBar
        title={division.name}
        subtitle={division.description}
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
        {/* Division header */}
        <div className={`p-6 rounded-2xl border ${division.borderColor} ${division.bgColor}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-background/50 flex items-center justify-center`}>
              <Icon size={28} className={division.textColor} />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${division.textColor}`}>{division.name}</h2>
              <p className="text-muted-foreground">{division.description}</p>
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FolderKanban size={16} className={division.textColor} />
                <span className="text-xs text-muted-foreground">Проекты</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{activeProjects.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">из {divisionProjects.length} всего</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className={division.textColor} />
                <span className="text-xs text-muted-foreground">Клиентов</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{divisionClients.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {divisionClients.filter((c) => c.status === 'active').length} активных
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className={division.textColor} />
                <span className="text-xs text-muted-foreground">Задачи</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{taskProgress}%</div>
              <div className="text-xs text-muted-foreground mt-0.5">{doneTasks}/{allTasks.length} завершено</div>
            </CardContent>
          </Card>

          {isFounder && (
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className={division.textColor} />
                  <span className="text-xs text-muted-foreground">Выручка</span>
                </div>
                <div className="text-xl font-bold text-emerald-600">{formatCurrency(monthlyRevenue)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">в месяц</div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Проекты дивизиона</h3>
              <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground">Все →</Link>
            </div>

            {divisionProjects.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="text-center py-12 text-muted-foreground">
                  <FolderKanban size={32} className="mx-auto mb-3 opacity-30" />
                  <p>Нет проектов</p>
                  <Link href="/projects/new">
                    <Button size="sm" className="mt-4 bg-amber-500 hover:bg-amber-600 text-black">
                      Создать первый проект
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              divisionProjects.map((project) => {
                const client = clients.find((c) => c.id === project.client_id)
                const projectTasks = tasks.filter((t) => t.project_id === project.id)
                const done = projectTasks.filter((t) => t.status === 'done').length
                const pct = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0

                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="bg-card border-border hover:border-amber-500/30 transition-all cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-foreground group-hover:text-amber-600 transition-colors">
                              {project.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">{client?.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isFounder && project.monthly_rate && (
                              <span className="text-sm font-semibold text-emerald-600">
                                {formatCurrency(project.monthly_rate)}/мес
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${PROJECT_STATUS_COLORS[project.status]}`}>
                              {PROJECT_STATUS_LABELS[project.status]}
                            </span>
                          </div>
                        </div>
                        {projectTasks.length > 0 && (
                          <div>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Задачи</span>
                              <span>{done}/{projectTasks.length}</span>
                            </div>
                            <Progress value={pct} className="h-1" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                )
              })
            )}
          </div>

          {/* Clients sidebar */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Клиенты</h3>
            {divisionClients.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="text-center py-8 text-muted-foreground text-sm">
                  Нет клиентов
                </CardContent>
              </Card>
            ) : (
              divisionClients.map((client) => {
                const clientProjects = projects.filter((p) => p.client_id === client.id && p.division === slug)
                return (
                  <Link key={client.id} href={`/clients/${client.id}`}>
                    <Card className="bg-card border-border hover:border-amber-500/30 transition-all cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-foreground group-hover:text-amber-600 transition-colors">
                            {client.name}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            client.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-slate-500/10 text-slate-500'
                          }`}>
                            {client.status === 'active' ? 'Актив.' : 'Неактив.'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {clientProjects.length} проектов · {clientProjects.filter((p) => p.status === 'active').length} активных
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
