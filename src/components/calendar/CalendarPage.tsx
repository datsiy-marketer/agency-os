'use client'

import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { useAppStore } from '@/lib/store'
import { DIVISION_MAP } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
  isWithinInterval,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  getDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, CreditCard, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function CalendarPage() {
  const { projects, clients, tasks, billingRecords } = useAppStore()
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  // Get days including padding from prev/next months for grid alignment
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDay = (day: Date) => {
    const events: Array<{ type: string; label: string; color: string; link?: string }> = []

    // Billing dates (1st and 15th)
    const dayNum = day.getDate()
    if ((dayNum === 1 || dayNum === 15) && isSameMonth(day, currentDate)) {
      const pendingBills = billingRecords.filter((b) => {
        const billDate = parseISO(b.billing_date)
        return isSameDay(billDate, day) && b.status === 'pending'
      })
      if (pendingBills.length > 0) {
        events.push({ type: 'billing', label: `Счета: ${pendingBills.length}`, color: 'bg-emerald-500' })
      } else if (isSameMonth(day, currentDate)) {
        events.push({ type: 'billing-day', label: 'День оплаты', color: 'bg-emerald-500/30' })
      }
    }

    // Tasks due
    const dueTasks = tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), day))
    if (dueTasks.length > 0) {
      events.push({ type: 'task', label: `Задачи: ${dueTasks.length}`, color: 'bg-amber-500' })
    }

    return events
  }

  const getProjectsForDay = (day: Date) => {
    return projects.filter((p) => {
      const start = parseISO(p.start_date)
      const end = p.end_date ? parseISO(p.end_date) : endOfMonth(addMonths(currentDate, 3))
      return isWithinInterval(day, { start, end }) && p.status === 'active'
    })
  }

  return (
    <div>
      <TopBar title="Календарь" subtitle="Проекты, задачи и даты выставления счётов" />

      <div className="p-6 space-y-6">
        {/* Month navigator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <ChevronLeft size={18} className="text-muted-foreground" />
            </button>
            <h2 className="text-xl font-bold text-foreground min-w-40 text-center">
              {format(currentDate, 'LLLL yyyy')}
            </h2>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          </div>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            Сегодня
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>День оплаты</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Дедлайн задачи</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span>Активный проект</span>
          </div>
        </div>

        {/* Calendar grid */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const isToday = isSameDay(day, new Date())
                const isCurrentMonth = isSameMonth(day, currentDate)
                const dayProjects = getProjectsForDay(day)
                const dayEvents = getEventsForDay(day)
                const dayNum = day.getDate()
                const isBillingDay = dayNum === 1 || dayNum === 15
                const hasBorder = idx % 7 !== 6

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-24 p-2 border-b border-border transition-colors ${
                      hasBorder ? 'border-r' : ''
                    } ${
                      isCurrentMonth ? 'bg-transparent hover:bg-accent/50' : 'bg-accent/20'
                    } ${
                      isBillingDay && isCurrentMonth ? 'bg-emerald-500/3' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-amber-500 text-black font-bold'
                            : isCurrentMonth
                            ? 'text-foreground'
                            : 'text-muted-foreground/40'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {isBillingDay && isCurrentMonth && (
                        <CreditCard size={10} className="text-emerald-500/50" />
                      )}
                    </div>

                    {/* Project bars */}
                    <div className="space-y-0.5">
                      {dayProjects.slice(0, 2).map((proj) => {
                        const div = DIVISION_MAP[proj.division]
                        const isStart = isSameDay(parseISO(proj.start_date), day)
                        return (
                          <Link key={proj.id} href={`/projects/${proj.id}`}>
                            <div
                              className={`text-[9px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${div.bgColor} ${div.textColor}`}
                            >
                              {isStart ? '▶ ' : ''}{proj.name.substring(0, 15)}
                            </div>
                          </Link>
                        )
                      })}
                      {dayProjects.length > 2 && (
                        <div className="text-[9px] text-muted-foreground px-1">
                          +{dayProjects.length - 2} ещё
                        </div>
                      )}

                      {/* Task indicators */}
                      {dayEvents.filter((e) => e.type === 'task').map((evt, i) => (
                        <div key={i} className={`text-[9px] px-1 py-0.5 rounded ${evt.color} text-black font-medium`}>
                          {evt.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Project timelines */}
        <div>
          <h3 className="font-semibold text-foreground mb-4">Активные проекты в этом месяце</h3>
          <div className="space-y-2">
            {projects
              .filter((p) => {
                if (p.status !== 'active') return false
                const start = parseISO(p.start_date)
                const end = p.end_date ? parseISO(p.end_date) : endOfMonth(addMonths(currentDate, 12))
                return (
                  isWithinInterval(monthStart, { start, end }) ||
                  isWithinInterval(monthEnd, { start, end }) ||
                  isWithinInterval(start, { start: monthStart, end: monthEnd })
                )
              })
              .map((project) => {
                const div = DIVISION_MAP[project.division]
                const client = clients.find((c) => c.id === project.client_id)
                const start = parseISO(project.start_date)
                const end = project.end_date
                  ? parseISO(project.end_date)
                  : endOfMonth(addMonths(currentDate, 12))
                const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                const daysIn = (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)
                const startOffset = Math.max(0, (monthStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                const barStart = Math.max(0, (start.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24) / daysIn * 100)
                const barEnd = Math.min(100, 100 - (end.getTime() - monthEnd.getTime()) / (1000 * 60 * 60 * 24) / daysIn * 100)
                const barWidth = Math.max(3, barEnd - barStart)

                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-amber-500/30 transition-all group">
                      <div className="w-32 shrink-0">
                        <div className="font-medium text-sm text-foreground group-hover:text-amber-400 transition-colors truncate">
                          {project.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{client?.name}</div>
                      </div>
                      <div className="flex-1 relative h-6 rounded bg-accent overflow-hidden">
                        <div
                          className={`absolute top-0 h-full rounded ${div.bgColor} border ${div.borderColor}`}
                          style={{ left: `${barStart}%`, width: `${barWidth}%` }}
                        />
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${div.bgColor} ${div.textColor} ${div.borderColor}`}>
                        {div.name}
                      </span>
                    </div>
                  </Link>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
