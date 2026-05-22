'use client'

import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { useAppStore } from '@/lib/store'
import { formatCurrency, calculatePieceRateSalary, getMonthName } from '@/lib/billing'
import { mockSalaryRecords } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Users, Lock, CheckCircle2, Clock, Info } from 'lucide-react'
import { format, subMonths, addMonths } from 'date-fns'
import { useSession } from 'next-auth/react'

export function SalariesPage() {
  const { employees, assignments, projects } = useAppStore()
  const { data: session } = useSession()
  const isFounder = session?.user && (session.user as any).role === 'founder'
  const [selectedMonth, setSelectedMonth] = useState(format(subMonths(new Date(), 1), 'yyyy-MM'))

  if (!isFounder) {
    return (
      <div>
        <TopBar title="Зарплаты" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Lock size={48} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-foreground">Доступ запрещён</p>
          </div>
        </div>
      </div>
    )
  }

  const prevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const prev = new Date(year, month - 2, 1)
    setSelectedMonth(format(prev, 'yyyy-MM'))
  }

  const nextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const next = new Date(year, month, 1)
    setSelectedMonth(format(next, 'yyyy-MM'))
  }

  // Calculate salaries for selected month
  const salaryData = employees.map((emp) => {
    if (emp.type === 'fixed-salary') {
      return {
        employee: emp,
        total: emp.fixed_salary || 0,
        breakdown: [],
        isFixed: true,
      }
    }
    const { total, breakdown } = calculatePieceRateSalary(emp, assignments, projects, selectedMonth)
    return { employee: emp, total, breakdown, isFixed: false }
  })

  const totalPayroll = salaryData.reduce((sum, s) => sum + s.total, 0)

  // Check if this is the mock month
  const isMockMonth = selectedMonth === '2025-03'

  return (
    <div>
      <TopBar
        title="Зарплаты"
        subtitle={`Выплата 1-го числа следующего месяца за предыдущий`}
      />

      <div className="p-6 space-y-6">
        {/* Month selector */}
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <ChevronLeft size={18} className="text-muted-foreground" />
          </button>
          <div className="min-w-48 text-center">
            <div className="text-xl font-bold text-foreground">{getMonthName(selectedMonth)}</div>
            <div className="text-xs text-muted-foreground">Расчётный период</div>
          </div>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Rules info */}
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Info size={16} className="text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Правила расчёта зарплат</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Сдельщики (Алина, Даша): ставка за проект, проразация при старте/окончании в середине месяца</li>
            <li>• Маша: фиксированный оклад, не зависит от проектов</li>
            <li>• Выплата: 1-го числа следующего месяца за текущий период</li>
          </ul>
        </div>

        {/* Total */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Фонд оплаты труда</div>
                <div className="text-3xl font-bold text-foreground">{formatCurrency(totalPayroll)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getMonthName(selectedMonth)} · выплата 1-го числа
                </div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Users size={28} className="text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee salary cards */}
        <div className="space-y-4">
          {salaryData.map(({ employee, total, breakdown, isFixed }) => {
            const record = isMockMonth ? mockSalaryRecords.find((r) => r.employee_id === employee.id) : null

            return (
              <Card key={employee.id} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0"
                      style={{ backgroundColor: employee.color }}
                    >
                      {employee.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-foreground">{employee.name}</h3>
                          <p className="text-xs text-muted-foreground">{employee.role}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-500">{formatCurrency(total)}</div>
                          <div className="flex items-center gap-1.5 justify-end mt-0.5">
                            {record ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                record.status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                  : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                              }`}>
                                {record.status === 'paid' ? 'Выплачено' : 'Ожидается'}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {isFixed ? 'Фикс. оклад' : 'Сдельно'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {!isFixed && breakdown.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Разбивка по проектам
                    </div>
                    <div className="space-y-2">
                      {breakdown.map((item) => {
                        const pct = Math.round((item.days_worked / item.days_in_month) * 100)
                        return (
                          <div key={item.project_id} className="flex items-center gap-3 p-2.5 rounded-lg bg-accent/50">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-foreground truncate">{item.project_name}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {item.pro_rated ? (
                                  <span className="text-[10px] text-amber-500">
                                    {item.days_worked}/{item.days_in_month} дней (проразация)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">
                                    Полный месяц · {formatCurrency(item.monthly_rate)}/мес
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-foreground shrink-0">
                              {formatCurrency(item.amount)}
                            </div>
                          </div>
                        )
                      })}
                      <div className="flex justify-between items-center pt-2 border-t border-border">
                        <span className="text-sm text-muted-foreground">Итого за {getMonthName(selectedMonth)}</span>
                        <span className="text-sm font-bold text-emerald-500">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </CardContent>
                )}

                {isFixed && (
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <Info size={14} className="text-blue-400 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Фиксированный оклад — не зависит от количества проектов. Выплачивается ежемесячно 1-го числа.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {/* Pro-rating calculator */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Калькулятор проразации</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Если проект начался или закончился в середине месяца, зарплата рассчитывается пропорционально:
              <br />
              <strong className="text-foreground">Сумма = (Ставка / Дни в месяце) × Дни работы</strong>
            </p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-accent/50 border border-border text-center">
                <div className="text-muted-foreground text-xs mb-1">30 000 ₽/мес, 31 день</div>
                <div className="font-bold text-foreground">15 дней</div>
                <div className="text-emerald-500 font-semibold">
                  {formatCurrency(Math.round(30000 / 31 * 15))}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-accent/50 border border-border text-center">
                <div className="text-muted-foreground text-xs mb-1">45 000 ₽/мес, 30 дней</div>
                <div className="font-bold text-foreground">20 дней</div>
                <div className="text-emerald-500 font-semibold">
                  {formatCurrency(Math.round(45000 / 30 * 20))}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-accent/50 border border-border text-center">
                <div className="text-muted-foreground text-xs mb-1">40 000 ₽/мес, 28 дней</div>
                <div className="font-bold text-foreground">10 дней</div>
                <div className="text-emerald-500 font-semibold">
                  {formatCurrency(Math.round(40000 / 28 * 10))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
