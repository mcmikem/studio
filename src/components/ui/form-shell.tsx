'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FormShellProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  showCancel?: boolean;
  className?: string;
}

export function FormShell({
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  showCancel = false,
  className,
}: FormShellProps) {
  return (
    <form onSubmit={onSubmit} className={cn('space-y-4 sm:space-y-6', className)}>
      {children}
      
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full sm:w-auto h-10 sm:h-11"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
        
        {showCancel && onCancel && (
          <Button 
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto h-10 sm:h-11"
          >
            {cancelLabel}
          </Button>
        )}
      </div>
    </form>
  );
}

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export function FormField({ children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  );
}

interface FormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function FormGrid({ children, columns = 2, className }: FormGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };
  
  return (
    <div className={cn('grid', gridCols[columns], 'gap-3 sm:gap-4', className)}>
      {children}
    </div>
  );
}

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'between';
}

export function FormActions({ children, className, align = 'right' }: FormActionsProps) {
  const alignment = {
    left: 'justify-start',
    right: 'justify-end',
    between: 'justify-between',
  };
  
  return (
    <div className={cn('flex flex-col sm:flex-row gap-2', alignment[align], className)}>
      {children}
    </div>
  );
}
