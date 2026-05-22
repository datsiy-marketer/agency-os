'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { useAppStore } from '@/lib/store'
import { DIVISION_MAP, PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, BILLING_TYPE_LABELS } from '@/lib/constants'
import { formatCurrency } from '@/lib/billing'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  FolderKanban,
  Phone,
  Mail,
  Users,
  Plus,
  Calendar,
  CreditCard,
  FileText,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useSession } from 'next-auth/react'

interface Props {
  clientId: string
}

export function ClientDetailPage({ clientId }: Props) {
  const { clients, projects } = useAppStore()
  const { data: session } = useSession()
  const isFounder = session?.user && (session.user as any).role === 'founder'
  const router = useRouter()

  const client = clients.find((c) => c.id === clientId)
  if (!client) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p>Клиент не найден</p>
          <Link href="/clients" className="text-amber-500 text-sm mt-2 inline-block">← Назад к клиентам</Link>
        </div>
      </div>
    )
  }

  const div = DIVISION_MAP[client.division]
  const clientProjects = projects.filter((p) => p.client_id === clientId)
  const activeProjects = clientProjects.filter((p) => p.status === 'active')

  const totalMonthlyRevenue = activeProjects
    .filter((p) => p.billing_type === 'monthly' && p.monthly_rate)
    .reduce((sum, p) => sum + (p.monthly_rate || 0), 0)

  return (
    <div>
      <TopBar
        title={client.name}
        subtitle={div.name}
        actions={
          <div className="flex gap-2">
            <Link href={`/projects/new`}>
              <Button size="sm" variant="outline" className="gap-2 border-border">
                <Plus size={16} />
                Новый проект
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Назад</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client info */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Информация</CardTitle>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${div.bgColor} ${div.textColor} ${div.borderColor}`}>
                  {div.name}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Статус</div>
                <span className={`text-xs px-2 py-0.5 rounded-full border inline-block ${
                  client.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                }`}>
                  {client.status === 'active' ? 'Активный' : 'Неактивный'}
                </span>
              </div>

              {client.contact_name && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Контактное лицо</div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users size={14} className="text-muted-foreground" />
                    {client.contact_name}
                  </div>
                </div>
              )}

              {client.contact_phone && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Телефон</div>
                  <a href={`tel:${client.contact_phone}`} className="flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400">
                    <Phone size={14} />
                    {client.contact_phone}
                  </a>
                </div>
              )}

              {client.contact_email && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Email</div>
                  <a href={`mailto:${client.contact_email}`} className="flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400">
                    <Mail size={14} />
                    {client.contact_email}
                  </a>
                </div>
              )}

              <div>
                <div className="text-xs text-muted-foreground mb-1">Клиент с</div>
                <div className="text-sm">
                  {format(parseISO(client.created_at), 'd MMMM yyyy')}
                </div>
              </div>

              {client.notes && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Заметки</div>
                  <p className="text-sm text-muted-foreground">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-foreground">{clientProjects.length}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Всего проектов</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-emerald-500">{activeProjects.length}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Активных</div>
                </CardContent>
              </Card>
              {isFounder && (
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="text-lg font-bold text-emerald-600">{formatCurrency(totalMonthlyRevenue)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">В месяц</div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Projects list */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Проекты</CardTitle>
                  <Link href="/projects/new">
                    <Button size="sm" variant="ghost" className="gap-1.5 h-7 text-xs text-muted-foreground hover:text-foreground">
                      <Plus size={14} />
                      Добавить
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {clientProjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <FolderKanban size={28} className="mx-auto mb-2 opacity-30" />
                    <p>Нет проектов</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientProjects.map((project) => (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                          <FolderKanban size={16} className="text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground group-hover:text-amber-400 transition-colors truncate">
                              {project.name}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                {format(parseISO(project.start_date), 'd MMM yyyy')}
                                {project.end_date && ` — ${format(parseISO(project.end_date), 'd MMM yyyy')}`}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {BILLING_TYPE_LABELS[project.billing_type]}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isFounder && (
                              <span className="text-sm font-semibold text-emerald-600">
                                {project.billing_type === 'monthly' && project.monthly_rate
                                  ? formatCurrency(project.monthly_rate)
                                  : project.one_time_fee
                                  ? formatCurrency(project.one_time_fee)
                                  : ''}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${PROJECT_STATUS_COLORS[project.status]}`}>
                              {PROJECT_STATUS_LABELS[project.status]}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
