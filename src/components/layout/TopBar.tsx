'use client'

import { Bell, Search } from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const { tasks, billingRecords } = useAppStore()

  const overdueCount =
    tasks.filter((t) => {
      if (t.status === 'done' || !t.due_date) return false
      return new Date(t.due_date) < new Date()
    }).length +
    billingRecords.filter((b) => b.status === 'overdue').length

  return (
    <header className="h-14 border-b border-border bg-card/30 backdrop-blur-sm flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1">
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {actions}

        <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
          <Bell size={16} className="text-muted-foreground" />
          {overdueCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
              {overdueCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
