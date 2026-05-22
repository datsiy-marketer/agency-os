'use client'

import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { useAppStore } from '@/lib/store'
import { formatCurrency, getNextBillingDate } from '@/lib/billing'
import { DIVISION_MAP } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Lock,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useSession } from 'next-auth/react'

export function FinancePage() {
  const { projects, billingRecords, employees, assignments } = useAppStore()
  const { data: session } = useSession()
  const isFounder = session?.user && (session.user as any).role === 'founder'

  if (!isFounder) {
    return (
      <div>
        <TopBar title="Финансы" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Lock size={48} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-foreground">Доступ запрещён</p>
            <p className="text-sm text-muted-foreground mt-2">
              Финансовая информация доступна только основателю
            </p>
          </div>
        </div>
      </div>
    )
  }

  const activeProjects = projects.filter((p) => p.status === 'active')

  const monthlyRevenue = activeProjects
    .filter((p) => p.billing_type === 'monthly' && p.monthly_rate)
    .reduce((sum, p) => sum + (p.monthly_rate || 0), 0)

  const pendingBills = billingRecords.filter((b) => b.status === 'pending')
  const paidBills = billingRecords.filter((b) => b.status === 'paid')
  const pendingTotal = pendingBills.reduce((sum, b) => sum + b.amount, 0)
  const paidTotal = paidBills.reduce((sum, b) => sum + b.amount, 0)

  const monthlyStaffCost = employees.reduce((sum, emp) => {
    if (emp.type === 'fixed-salary') return sum + (emp.fixed_salary || 0)
    const empAssignments = assignments.filter((a) => a.employee_id === emp.id)
    const activeEmpAssignments = empAssignments.filter((a) => {
      const proj = projects.find((p) => p.id === a.project_id)
      return proj && proj.status === 'active'
    })
    return sum + activeEmpAssignments.reduce((s, a) => s + (a.monthly_rate || 0), 0)
  }, 0)

  const grossMargin = monthlyRevenue > 0
    ? Math.round(((monthlyRevenue - monthlyStaffCost) / monthlyRevenue) * 100)
    : 0

  const nextBillingDate = getNextBillingDate()

  // Revenue by division
  const revenueByDivision = ['ignite', 'noise-dealers', 'other'].map((divId) => {
    const divProjects = activeProjects.filter((p) => p.division === divId && p.billing_type === 'monthly')
    const revenue = divProjects.reduce((sum, p) => sum + (p.monthly_rate || 0), 0)
    return { divId, revenue, projects: divProjects.length }
  })

  return (
    <div>
      <TopBar
        title="Финансы"
        subtitle="Только для основателя"
        actions={
          <div className="flex gap-2">
            <Link href="/finance/billing">
              <Button size="sm" variant="outline" className="border-border gap-2">
                <CreditCard size={16} />
                Счета
              </Button>
            </Link>
            <Link href="/finance/salaries">
              <Button size="sm" variant="outline" className="border-border gap-2">
                <Users size={16} />
                Зарплаты
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Founder-only badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 w-fit">
          <Lock size={14} className="text-amber-500" />
          <span className="text-sm text-amber-500 font-medium">Финансовые данные — только для основателя</span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <TrendingUp size={16} className="text-emerald-500" />
                </div>
                <span className="text-xs text-muted-foreground">Ежемесячно</span>
              </div>
              <div className="text-2xl font-bold text-emerald-500">{formatCurrency(monthlyRevenue)}</div>
              <div className="text-xs text-muted-foreground mt-1">Выручка от активных проектов</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                  <TrendingDown size={16} className="text-red-400" />
                </div>
                <span className="text-xs text-muted-foreground">Расходы</span>
              </div>
              <div className="text-2xl font-bold text-red-400">{formatCurrency(monthlyStaffCost)}</div>
              <div className="text-xs text-muted-foreground mt-1">Затраты на команду</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                  <TrendingUp size={16} className="text-violet-400" />
                </div>
                <span className="text-xs text-muted-foreground">Маржа</span>
              </div>
              <div className={`text-2xl font-bold ${grossMargin >= 50 ? 'text-emerald-500' : grossMargin >= 30 ? 'text-amber-500' : 'text-red-500'}`}>
                {grossMargin}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatCurrency(monthlyRevenue - monthlyStaffCost)} прибыли
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center">
                  <Calendar size={16} className="text-yellow-500" />
                </div>
                <span className="text-xs text-muted-foreground">Ожидается</span>
              </div>
              <div className="text-2xl font-bold text-yellow-500">{formatCurrency(pendingTotal)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Следующий счёт: {format(nextBillingDate, 'd MMM')}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by division */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Выручка по дивизионам</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {revenueByDivision.map(({ divId, revenue, projects: projCount }) => {
                const div = DIVISION_MAP[divId]
                const pct = monthlyRevenue > 0 ? Math.round((revenue / monthlyRevenue) * 100) : 0
                return (
                  <div key={divId}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${div.textColor}`}>{div.name}</span>
                        <span className="text-xs text-muted-foreground">· {projCount} проектов</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-foreground">{formatCurrency(revenue)}</span>
                        <span className="text-xs text-muted-foreground ml-2">{pct}%</span>
                      </div>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                )
              })}

              <div className="pt-3 border-t border-border flex justify-between">
                <span className="text-sm text-muted-foreground">Итого</span>
                <span className="text-sm font-bold text-emerald-500">{formatCurrency(monthlyRevenue)}/мес</span>
              </div>
            </CardContent>
          </Card>

          {/* Pending bills */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Ожидаемые платежи</CardTitle>
                <Link href="/finance/billing" className="text-xs text-amber-500 hover:text-amber-400">
                  Все →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {pendingBills.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                  Все счета оплачены
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingBills.slice(0, 5).map((bill) => {
                    const project = projects.find((p) => p.id === bill.project_id)
                    const div = project ? DIVISION_MAP[project.division] : null
                    return (
                      <div key={bill.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                        {div && (
                          <div className={`w-2 h-2 rounded-full ${div.textColor.replace('text-', 'bg-')}`} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{project?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(bill.billing_date), 'd MMM yyyy')}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-amber-500">{formatCurrency(bill.amount)}</div>
                          <div className="text-xs text-yellow-500">ожидается</div>
                        </div>
                      </div>
                    )
                  })}
                  <div className="pt-2 flex justify-between items-center border-t border-border">
                    <span className="text-sm text-muted-foreground">Итого ожидается</span>
                    <span className="text-sm font-bold text-amber-500">{formatCurrency(pendingTotal)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Project profitability table */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Рентабельность проектов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeProjects.filter((p) => p.billing_type === 'monthly').map((project) => {
                const div = DIVISION_MAP[project.division]
                const projectAssignments = assignments.filter((a) => a.project_id === project.id)
                const staffCost = projectAssignments.reduce((sum, a) => sum + (a.monthly_rate || 0), 0)
                const revenue = project.monthly_rate || 0
                const profit = revenue - staffCost
                const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0

                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="grid grid-cols-5 gap-4 items-center p-3 rounded-lg hover:bg-accent transition-colors">
                      <div className="col-span-2">
                        <div className="text-sm font-medium text-foreground hover:text-amber-400 transition-colors truncate">
                          {project.name}
                        </div>
                        <span className={`text-xs ${div.textColor}`}>{div.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-emerald-500">{formatCurrency(revenue)}</div>
                        <div className="text-[10px] text-muted-foreground">выручка</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-red-400">{formatCurrency(staffCost)}</div>
                        <div className="text-[10px] text-muted-foreground">расходы</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${margin >= 50 ? 'text-emerald-500' : margin >= 30 ? 'text-amber-500' : 'text-red-500'}`}>
                          {margin}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">маржа</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
