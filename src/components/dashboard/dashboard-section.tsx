
"use client"

import { useState, useEffect, useId, type ReactNode } from 'react'
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
  const contentId = useId()

  useEffect(() => {
    if (isOpen && lazy && !hasLoaded) {
      setHasLoaded(true)
    }
  }, [isOpen, lazy, hasLoaded])

  const shouldRenderContent = lazy ? hasLoaded : true

  return (
    <Card className={cn('border-omuto-navy/6', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <CardHeader className="py-3.5 px-5 hover:bg-omuto-navy/[0.02] transition-colors border-b border-omuto-navy/6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-1.5 bg-omuto-navy/5 rounded-lg">
                  <Icon className="h-4 w-4 text-omuto-navy/60" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold tracking-tight text-omuto-navy/90">
                    {title}
                  </CardTitle>
                  {badge && (
                    <span className={cn(
                      'text-xs font-black px-2 py-0.5 rounded-full',
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
      <div id={contentId} className={cn('overflow-hidden transition-all duration-300', isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0')}>
        {shouldRenderContent && (
          <div className="p-5">
            {children}
          </div>
        )}
      </div>
      {!isOpen && (
        <div className="px-5 pb-3 text-xs text-muted-foreground font-medium">
          Click to expand
        </div>
      )}
    </Card>
  )
}

interface CompactStatCardProps {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  color?: string;
  href?: string;
}

export function CompactStatCard({ label, value, icon: Icon, color = "bg-primary", href }: CompactStatCardProps) {
  const content = (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
      {Icon && (
        <div className={cn("p-2 rounded-md", color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      )}
      <div>
        <p className="text-xs text-muted-foreground uppercase font-medium">{label}</p>
        <p className="text-lg font-black">{value}</p>
      </div>
    </div>
  );
  
  if (href) {
    return <a href={href} className="block">{content}</a>;
  }
  return content;
}
