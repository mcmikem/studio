'use client';

import { cn } from '@/lib/utils';
import { LucideIcon, MoreHorizontal, Pencil, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface Action<T> {
  label: string;
  icon?: LucideIcon;
  onClick: (item: T) => void;
  variant?: 'default' | 'destructive';
  requiresRole?: string[];
}

interface MobileCard<T> {
  render: (item: T) => React.ReactNode;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  actions?: Action<T>[];
  mobileCard?: MobileCard<T>;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  actions = [],
  mobileCard,
  onRowClick,
  emptyMessage = 'No data available',
  isLoading = false,
  className,
}: ResponsiveTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = (a as any)[sortKey];
    const bVal = (b as any)[sortKey];
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('text-center py-12 text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-omuto-navy/10 bg-muted/30">
              {columns.map(col => (
                <th 
                  key={col.key}
                  className={cn(
                    'px-3 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/90',
                    col.sortable && 'cursor-pointer hover:bg-muted/50'
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-3 py-2 sm:px-4 sm:py-3 text-right text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/90">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, idx) => (
              <tr 
                key={keyExtractor(item) || idx}
                className={cn(
                  'border-b border-omuto-navy/5 hover:bg-muted/30 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-3 py-2 sm:px-4 sm:py-3 text-sm">
                    {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-right">
                    <ActionsMenu item={item} actions={actions} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {sortedData.map((item, idx) => (
          <div 
            key={keyExtractor(item) || idx}
            className={cn(
              'bg-card border border-omuto-navy/10 rounded-xl p-4',
              onRowClick && 'cursor-pointer'
            )}
            onClick={() => onRowClick?.(item)}
          >
            {mobileCard ? mobileCard.render(item) : (
              <div className="space-y-2">
                {columns.slice(0, 3).map(col => (
                  <div key={col.key}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {col.header}
                    </span>
                    <p className="text-sm font-medium truncate">
                      {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {actions.length > 0 && (
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-omuto-navy/10">
                {actions.slice(0, 2).map((action, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick(item);
                    }}
                    className="h-8 text-xs"
                  >
                    {action.icon && <action.icon className="h-3 w-3 mr-1" />}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionsMenu<T>({ item, actions }: { item: T; actions: Action<T>[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, i) => (
          <div key={i}>
            {action.label === 'Delete' && <DropdownMenuSeparator />}
            <DropdownMenuItem 
              onClick={() => action.onClick(item)}
              className={action.variant === 'destructive' ? 'text-destructive' : ''}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </DropdownMenuItem>
            {action.label === 'Delete' && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
