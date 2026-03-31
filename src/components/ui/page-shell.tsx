'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn('w-full overflow-hidden space-y-4 sm:space-y-6', className)}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  compact?: boolean;
}

export function PageHeader({ 
  title, 
  description, 
  icon: Icon, 
  action, 
  className,
  titleClassName,
  compact = false,
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 text-omuto-navy">
          {Icon && (
            <div className={cn('bg-omuto-navy/10 rounded-xl p-1.5 sm:p-3', compact ? 'p-1.5' : 'p-3')}>
              <Icon className={cn('text-omuto-red', compact ? 'h-4 w-4 sm:h-6 sm:w-6' : 'h-6 w-6 sm:h-8 sm:w-8')} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className={cn(
              'font-heading font-bold tracking-tight truncate',
              compact ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl lg:text-4xl',
              titleClassName
            )}>
              {title}
            </h1>
            {description && (
              <p className={cn(
                'font-bold text-omuto-navy/60 uppercase tracking-widest truncate',
                 compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-xs'
              )}>
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </header>
  );
}

interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function ContentCard({ children, className, noPadding = false }: ContentCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className={cn(noPadding ? 'p-0' : 'p-4 sm:p-6')}>
        {children}
      </CardContent>
    </Card>
  );
}

interface CardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function CardGrid({ children, columns = 3, className }: CardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };
  
  return (
    <div className={cn('grid', gridCols[columns], 'gap-3 sm:gap-4 lg:gap-6', className)}>
      {children}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'danger' | 'muted';
  icon?: LucideIcon;
  className?: string;
}

export function SummaryCard({ label, value, variant = 'default', icon: Icon, className }: SummaryCardProps) {
  const variantStyles = {
    default: 'bg-card',
    success: 'bg-green-500/10 border-green-500/20',
    danger: 'bg-red-500/10 border-red-500/20',
    muted: 'bg-muted',
  };
  
  const valueStyles = {
    default: 'text-foreground',
    success: 'text-green-600',
    danger: 'text-red-600',
    muted: 'text-foreground',
  };
  
  return (
    <Card className={cn('p-3 sm:p-4', variantStyles[variant], className)}>
      <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{label}</p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className={cn('h-4 w-4', valueStyles[variant])} />}
        <p className={cn('text-lg sm:text-xl font-bold truncate', valueStyles[variant])}>
          {value}
        </p>
      </div>
    </Card>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn('p-4 sm:p-8', className)}>
      <div className="flex flex-col items-center justify-center text-center py-8 sm:py-12">
        <div className={cn(
          'bg-muted rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6',
          'border border-omuto-navy/10'
        )}>
          <Icon className="h-8 w-8 sm:h-12 sm:w-12 text-omuto-navy/30" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold tracking-tighter uppercase text-omuto-navy">
          {title}
        </h3>
        <p className="max-w-xs text-omuto-navy/60 font-bold mt-2 text-xs sm:text-sm uppercase tracking-wide leading-relaxed">
          {description}
        </p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </Card>
  );
}
