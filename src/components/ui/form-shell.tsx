'use client';

import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

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

// Mobile Form Scaffold components

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
}

export function FormSection({ title, children, defaultOpen = true, collapsible = false, className }: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <div className={cn('space-y-3 sm:space-y-4', className)}>
        <h3 className="text-sm font-black uppercase tracking-widest text-omuto-navy/70">{title}</h3>
        {children}
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn('border border-omuto-navy/10 rounded-xl overflow-hidden', className)}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
        <h3 className="text-sm font-black uppercase tracking-widest text-omuto-navy/70">{title}</h3>
        <ChevronDown className={cn('h-4 w-4 text-omuto-navy/50 transition-transform', isOpen && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 space-y-3 sm:space-y-4">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface FormErrorSummaryProps {
  errors: string[];
  className?: string;
}

export function FormErrorSummary({ errors, className }: FormErrorSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-xl border-2 border-omuto-red/30 bg-omuto-red/5', className)}>
      <AlertCircle className="h-5 w-5 text-omuto-red flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-omuto-red mb-1">Please fix the following errors:</p>
        <ul className="space-y-0.5">
          {errors.map((error, i) => (
            <li key={i} className="text-xs text-omuto-navy/70">{error}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface FormStickyFooterProps {
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  showCancel?: boolean;
  className?: string;
}

export function FormStickyFooter({
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  showCancel = false,
  className,
}: FormStickyFooterProps) {
  return (
    <div className={cn(
      'sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t-2 border-omuto-navy/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]',
      className
    )}>
      <div className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full sm:w-auto h-11"
          onClick={onSubmit as any}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
        
        {showCancel && onCancel && (
          <Button 
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto h-11"
          >
            {cancelLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
