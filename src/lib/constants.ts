import type { DivisionConfig } from '@/types'

export const DIVISIONS: DivisionConfig[] = [
  {
    id: 'ignite',
    name: 'Ignite',
    color: 'amber',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-500',
    borderColor: 'border-amber-500/30',
    description: 'Маркетинг недвижимости',
  },
  {
    id: 'noise-dealers',
    name: 'Noise Dealers',
    color: 'violet',
    bgColor: 'bg-violet-500/10',
    textColor: 'text-violet-500',
    borderColor: 'border-violet-500/30',
    description: 'Ивент маркетинг',
  },
  {
    id: 'other',
    name: 'Прочее',
    color: 'slate',
    bgColor: 'bg-slate-500/10',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-500/30',
    description: 'Разные проекты',
  },
]

export const DIVISION_MAP = Object.fromEntries(DIVISIONS.map((d) => [d.id, d])) as Record<string, DivisionConfig>

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: 'Активный',
  completed: 'Завершён',
  paused: 'На паузе',
  planning: 'Планирование',
}

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  completed: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  planning: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: 'К выполнению',
  'in-progress': 'В работе',
  review: 'На проверке',
  done: 'Готово',
}

export const BILLING_TYPE_LABELS: Record<string, string> = {
  monthly: 'Ежемесячно',
  'one-time': 'Единоразово',
}

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  event: 'Ивент',
  'real-estate': 'Недвижимость',
  other: 'Прочее',
}

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-slate-400',
  medium: 'text-yellow-500',
  high: 'text-red-500',
}
