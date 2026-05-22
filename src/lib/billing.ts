import {
  getDaysInMonth,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  addMonths,
  parseISO,
  format,
  isAfter,
  isBefore,
  setDate,
} from 'date-fns'
import type { Project, Employee, ProjectAssignment, SalaryBreakdown } from '@/types'

/**
 * Calculate pro-rated amount for a partial month
 */
export function calculateProRatedAmount(
  monthlyRate: number,
  periodStart: Date,
  periodEnd: Date
): number {
  const monthStart = startOfMonth(periodStart)
  const monthEnd = endOfMonth(periodStart)
  const daysInMonth = getDaysInMonth(periodStart)
  const daysWorked = differenceInDays(periodEnd, periodStart) + 1
  return Math.round((monthlyRate / daysInMonth) * Math.min(daysWorked, daysInMonth))
}

/**
 * Get next billing date (1st or 15th of month)
 * Billing is on the 1st and 15th. Money collected only when full month has passed.
 */
export function getNextBillingDate(fromDate: Date = new Date()): Date {
  const day = fromDate.getDate()
  if (day < 15) {
    return setDate(fromDate, 15)
  }
  return setDate(addMonths(fromDate, 1), 1)
}

/**
 * Get upcoming billing amounts for active projects
 */
export function getUpcomingBilling(
  projects: Project[],
  billingDate?: Date
): Array<{ project: Project; amount: number; date: Date; type: string }> {
  const date = billingDate || getNextBillingDate()
  const results = []

  for (const project of projects) {
    if (project.status !== 'active') continue

    const startDate = parseISO(project.start_date)
    const now = new Date()

    if (project.billing_type === 'monthly' && project.monthly_rate) {
      // Check if a full month has passed since project start
      const monthsSinceStart = differenceInDays(now, startDate) / 30
      if (monthsSinceStart >= 1) {
        results.push({
          project,
          amount: project.monthly_rate,
          date,
          type: 'regular',
        })
      } else {
        // Pro-rate for partial first month
        const periodEnd = endOfMonth(startDate)
        const proRated = calculateProRatedAmount(project.monthly_rate, startDate, periodEnd)
        results.push({
          project,
          amount: proRated,
          date,
          type: 'pro-rated',
        })
      }
    }
  }

  return results
}

/**
 * Calculate salary for a piece-rate employee for a given month
 */
export function calculatePieceRateSalary(
  employee: Employee,
  assignments: ProjectAssignment[],
  projects: Project[],
  month: string // format: 'YYYY-MM'
): { total: number; breakdown: SalaryBreakdown[] } {
  const [year, monthNum] = month.split('-').map(Number)
  const monthDate = new Date(year, monthNum - 1, 1)
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const daysInMonth = getDaysInMonth(monthDate)

  const employeeAssignments = assignments.filter((a) => a.employee_id === employee.id)
  const breakdown: SalaryBreakdown[] = []
  let total = 0

  for (const assignment of employeeAssignments) {
    if (!assignment.monthly_rate) continue

    const project = projects.find((p) => p.id === assignment.project_id)
    if (!project) continue

    const assignStart = parseISO(assignment.start_date)
    const assignEnd = assignment.end_date ? parseISO(assignment.end_date) : monthEnd

    // Check if assignment overlaps with this month
    if (isAfter(assignStart, monthEnd) || isBefore(assignEnd, monthStart)) continue

    // Calculate actual days worked in this month
    const effectiveStart = isAfter(assignStart, monthStart) ? assignStart : monthStart
    const effectiveEnd = isBefore(assignEnd, monthEnd) ? assignEnd : monthEnd
    const daysWorked = differenceInDays(effectiveEnd, effectiveStart) + 1
    const isProRated = daysWorked < daysInMonth

    const amount = isProRated
      ? Math.round((assignment.monthly_rate / daysInMonth) * daysWorked)
      : assignment.monthly_rate

    breakdown.push({
      project_id: project.id,
      project_name: project.name,
      days_worked: daysWorked,
      days_in_month: daysInMonth,
      monthly_rate: assignment.monthly_rate,
      amount,
      pro_rated: isProRated,
    })
    total += amount
  }

  return { total, breakdown }
}

/**
 * Format currency in Russian locale
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format date in Russian locale
 */
export function formatDate(date: string | Date, fmt = 'd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: undefined })
}

/**
 * Get month name in Russian
 */
export function getMonthName(month: string): string {
  const [year, monthNum] = month.split('-').map(Number)
  const date = new Date(year, monthNum - 1, 1)
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ]
  return `${months[date.getMonth()]} ${year}`
}
