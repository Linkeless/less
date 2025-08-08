'use client'

import * as React from 'react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: string | null
  label?: string | null
}

function getStatusLabel(status?: string | null): string {
  const s = (status || '').toLowerCase()
  switch (s) {
    case 'open': return '打开'
    case 'in_progress': return '处理中'
    case 'pending': return '待处理'
    case 'resolved': return '已解决'
    case 'closed': return '已关闭'
    default: return status || '-'
  }
}

function getStatusStyle(status?: string | null): { variant: BadgeProps['variant']; className?: string } {
  const s = (status || '').toLowerCase()
  switch (s) {
    case 'open':
      return { variant: 'secondary', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' }
    case 'in_progress':
      return { variant: 'secondary', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
    case 'pending':
      return { variant: 'secondary', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300' }
    case 'resolved':
      return { variant: 'secondary', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' }
    case 'closed':
      return { variant: 'destructive' }
    default:
      return { variant: 'outline' }
  }
}

export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const { variant, className: colorClass } = getStatusStyle(status)
  return (
    <Badge variant={variant} className={cn(colorClass, className)} {...props}>
      {label ?? getStatusLabel(status)}
    </Badge>
  )
}

export default StatusBadge


