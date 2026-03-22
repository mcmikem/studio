
"use client"

import { useState, useEffect, type ReactNode } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardSectionProps {
  title: string
  description?: string
  icon?: React.ElementType
  defaultOpen?: boolean
  action?: ReactNode
  className?: string
  children: ReactNode
  badge?: string
  badgeColor?: 'green' | 'yellow' | 'red'
  lazy?: boolean
}

export function DashboardSection({
  title,
  description,
  icon: Icon,
  defaultOpen = false,
  action,
  className,
  children,
  badge,
  badgeColor,
  lazy = false,
}: DashboardSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [hasLoaded, setHasLoaded] = useState(defaultOpen)

  useEffect(() => {
    if (isOpen && lazy && !hasLoaded) {
      setHasLoaded(true)
    }
  }, [isOpen, lazy, hasLoaded])

  const shouldRenderContent = lazy ? hasLoaded : true

  return (
    <Card className={cn('border-omuto-navy/10', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left"
      >
        <CardHeader className="bg-omuto-cream/30 border-b border-omuto-navy/10 py-3 px-5 hover:bg-omuto-cream/50 transition-colors">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-black uppercase tracking-widest">
                    {title}
                  </CardTitle>
                  {badge && (
                    <span className={cn(
                      'text-[10px] font-black px-2 py-0.5 rounded-full',
                      badgeColor === 'green' && 'bg-green-100 text-green-700',
                      badgeColor === 'yellow' && 'bg-yellow-100 text-yellow-700',
                      badgeColor === 'red' && 'bg-red-100 text-red-700',
                      !badgeColor && 'bg-muted text-muted-foreground',
                    )}>
                      {badge}
                    </span>
                  )}
                </div>
                {description && (
                  <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {action}
              <div className={cn('transition-transform duration-200', isOpen ? 'rotate-0' : '-rotate-90')}>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardHeader>
      </button>
      <div className={cn('overflow-hidden transition-all duration-300', isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0')}>
        {shouldRenderContent && (
          <div className="p-5">
            {children}
          </div>
        )}
      </div>
      {!isOpen && (
        <div className="px-5 pb-3 text-[10px] text-muted-foreground font-medium">
          Click to expand · data loads on open
        </div>
      )}
    </Card>
  )
}
