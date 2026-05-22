'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CalendarDays,
  UserCircle,
  CreditCard,
  Settings,
  Flame,
  Music2,
  Layers,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { useSession, signOut } from 'next-auth/react'

const mainNavItems = [
  { href: '/', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/clients', label: 'Клиенты', icon: Users },
  { href: '/projects', label: 'Проекты', icon: FolderKanban },
  { href: '/calendar', label: 'Календарь', icon: CalendarDays },
  { href: '/staff', label: 'Команда', icon: UserCircle },
]

const divisionItems = [
  {
    href: '/divisions/ignite',
    label: 'Ignite',
    icon: Flame,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    activeBg: 'bg-amber-500/15',
  },
  {
    href: '/divisions/noise-dealers',
    label: 'Noise Dealers',
    icon: Music2,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    activeBg: 'bg-violet-500/15',
  },
  {
    href: '/divisions/other',
    label: 'Прочее',
    icon: Layers,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
    activeBg: 'bg-slate-500/15',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { projects, tasks } = useAppStore()
  const { data: session } = useSession()

  const isFounder = session?.user && (session.user as any).role === 'founder'
  const userName = session?.user?.name || 'Пользователь'

  const pendingTasks = tasks.filter((t) => t.status !== 'done').length
  const activeProjects = projects.filter((p) => p.status === 'active').length

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
            <span className="text-black font-bold text-sm">A</span>
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground">Agency OS</div>
            <div className="text-xs text-muted-foreground">Управление агентством</div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="px-4 py-3 border-b border-sidebar-border flex gap-4">
        <div className="text-center">
          <div className="text-lg font-bold text-amber-500">{activeProjects}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">проектов</div>
        </div>
        <div className="w-px bg-sidebar-border" />
        <div className="text-center">
          <div className="text-lg font-bold text-violet-500">{pendingTasks}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">задач</div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
          Главное
        </div>
        {mainNavItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                isActive
                  ? 'bg-amber-500/15 text-amber-600 font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
              )}
            >
              <Icon size={16} className={isActive ? 'text-amber-500' : 'text-muted-foreground'} />
              <span>{item.label}</span>
              {item.label === 'Проекты' && activeProjects > 0 && (
                <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-600 rounded-full px-1.5 py-0.5 font-medium">
                  {activeProjects}
                </span>
              )}
            </Link>
          )
        })}

        {/* Divisions */}
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mt-5 mb-2">
          Дивизионы
        </div>
        {divisionItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                isActive
                  ? `${item.activeBg} ${item.color} font-medium`
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
              )}
            >
              <Icon
                size={16}
                className={isActive ? item.color : 'text-muted-foreground'}
              />
              <span>{item.label}</span>
              <ChevronRight
                size={12}
                className={cn('ml-auto text-muted-foreground/50', isActive && item.color)}
              />
            </Link>
          )
        })}

        {/* Finance - founder only */}
        {isFounder && (
          <>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mt-5 mb-2">
              Финансы
            </div>
            <Link
              href="/finance"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                pathname.startsWith('/finance')
                  ? 'bg-emerald-500/15 text-emerald-600 font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
              )}
            >
              <CreditCard
                size={16}
                className={pathname.startsWith('/finance') ? 'text-emerald-500' : 'text-muted-foreground'}
              />
              <span>Финансы</span>
              <span className="ml-auto text-[10px] text-emerald-600 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                Основатель
              </span>
            </Link>
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
            pathname === '/settings'
              ? 'bg-sidebar-accent text-foreground font-medium'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
          )}
        >
          <Settings size={16} className="text-muted-foreground" />
          <span>Настройки</span>
        </Link>

        {/* User info & logout */}
        <div className="px-3 py-2 mt-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
              <span className="text-black text-[11px] font-bold">{userName[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">{userName}</div>
              <div className="text-[10px] text-muted-foreground">
                {isFounder ? 'Основатель' : 'Сотрудник'}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={13} />
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
