"use client"

import { cn } from "@/lib/utils"

interface ProgressProps {
  value?: number
  className?: string
  indicatorClassName?: string
}

function Progress({ value = 0, className, indicatorClassName }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      <div
        data-slot="progress-indicator"
        className={cn(
          "h-full rounded-full bg-primary transition-all duration-300",
          indicatorClassName
        )}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  )
}

export { Progress }
