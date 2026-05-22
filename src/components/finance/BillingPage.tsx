'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { useAppStore } from '@/lib/store'
import { formatCurrency, getNextBillingDate, calculateProRatedAmount } from '@/lib/billing'
import { DIVISION_MAP } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Calendar, CheckCircle2, Clock, AlertTriangle, Lock } from 'lucide-react'
import { format, parseISO, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { useSession } from 'next-auth/react'

export function BillingPage() {
  const { projects, billingRecords, clients } = useAppStore()
  const { data: session } = useSession()
  const isFounder = session?.user && (session.user as any).role === 'founder'
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')

  if (!isFounder) {
    return (
      <div>
        <TopBar title="Выставление счётов" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Lock size={48} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-foreground">Доступ запрещён</p>
          </div>
        </div>
      </div>
    )
  }

  const filtered = billingRecords.filter((b) => filter === 'all' || b.status === filter)

  const totalPending = billingRecords.filter((b) => b.status === 'pending').reduce((s, b) => s + b.amount, 0)
  const totalPaid = billingRecords.filter((b) => b.status === 'paid').reduce((s, b) => s + b.amount, 0)

  const nextBillingDate = getNextBillingDate()

  // Upcoming billing
  const activeProjects = projects.filter((p) => p.status === 'active' && p.billing_type === 'monthly')
  const upcomingBilling = activeProjects.map((project) => {
    const client = clients.find((c) => c.id === project.client_id)
    const start = parseISO(project.start_date)
    const monthStart = startOfMonth(new Date())
    const monthEnd = endOfMonth(new Date())

    // Check if started mid-month
    const isPartialMonth = start > monthStart && start <= monthEnd
    const amount = isPartialMonth
      ? calculateProRatedAmount(project.monthly_rate || 0, start, monthEnd)
      : (project.monthly_rate || 0)

    return {
      project,
      client,
      amount,
      date: nextBillingDate,
      isProRated: isPartialMonth,
    }
  })

  return (
    <div>
      <TopBar
        title="Счета и платежи"
        subtitle="Управление выставлением счётов"
      />

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-yellow-500" />
                <span className="text-xs text-muted-foreground">Ожидается</span>
              </div>
              <div className="text-xl font-bold text-yellow-500">{formatCurrency(totalPending)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {billingRecords.filter((b) => b.status === 'pending').length} счётов
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-xs text-muted-foreground">Оплачено всего</span>
              </div>
              <div className="text-xl font-bold text-emerald-500">{formatCurrency(totalPaid)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {billingRecords.filter((b) => b.status === 'paid').length} счётов
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-amber-500" />
                <span className="text-xs text-muted-foreground">Следующий счёт</span>
              </div>
              <div className="text-xl font-bold text-amber-500">{format(nextBillingDate, 'd MMM yyyy')}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {formatCurrency(upcomingBilling.reduce((s, b) => s + b.amount, 0))} к выставлению
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming billing */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar size={16} className="text-amber-500" />
              Предстоящие счета — {format(nextBillingDate, 'd MMMM yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingBilling.map(({ project, client, amount, isProRated }) => {
                const div = DIVISION_MAP[project.division]
                return (
                  <div key={project.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 border border-border">
                    <div className={`w-2 h-2 rounded-full ${div.textColor.replace('text-', 'bg-')}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{project.name}</div>
                      <div className="text-xs text-muted-foreground">{client?.name} · {div.name}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-emerald-500">{formatCurrency(amount)}</div>
                      {isProRated && (
                        <div className="text-[10px] text-amber-500">проразация</div>
                      )}
                    </div>
                  </div>
                )
              })}
              <div className="pt-2 border-t border-border flex justify-between items-center">
                <span className="text-sm font-semibold text-foreground">Итого к выставлению</span>
                <span className="text-sm font-bold text-emerald-500">
                  {formatCurrency(upcomingBilling.reduce((s, b) => s + b.amount, 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing history */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">История счётов</CardTitle>
              <div className="flex gap-2">
                {(['all', 'pending', 'paid', 'overdue'] as const).map((f) => {
                  const labels = { all: 'Все', pending: 'Ожидается', paid: 'Оплачено', overdue: 'Просрочено' }
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        filter === f
                          ? 'bg-amber-500 text-black'
                          : 'bg-accent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {labels[f]}
                    </button>
                  )
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filtered.map((bill) => {
                const project = projects.find((p) => p.id === bill.project_id)
                const client = clients.find((c) => c.id === project?.client_id)
                const div = project ? DIVISION_MAP[project.division] : null

                return (
                  <div key={bill.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    {div && (
                      <div className={`w-2 h-2 rounded-full shrink-0 ${div.textColor.replace('text-', 'bg-')}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{project?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {client?.name} · {format(new Date(bill.billing_date), 'd MMM yyyy')}
                        {bill.period_start && ` · ${format(new Date(bill.period_start), 'MMM yyyy')}`}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-foreground">{formatCurrency(bill.amount)}</div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        bill.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : bill.status === 'overdue'
                          ? 'bg-red-500/10 text-red-500 border-red-500/30'
                          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                      }`}>
                        {bill.status === 'paid' ? 'Оплачен' : bill.status === 'overdue' ? 'Просрочен' : 'Ожидается'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
