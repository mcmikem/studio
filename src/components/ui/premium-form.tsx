'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function PremiumInput({ 
  label, 
  error, 
  icon, 
  className,
  ...props 
}: PremiumInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1">
          {label}
        </Label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <Input 
          className={cn(
            "h-12 sm:h-14 border rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold tracking-tight text-omuto-navy bg-white",
            icon && "pl-10",
            error && "border-omuto-red",
            className
          )} 
          {...props} 
        />
      </div>
      {error && <p className="text-omuto-red text-xs font-bold pt-1">{error}</p>}
    </div>
  );
}

interface PremiumTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function PremiumTextarea({ 
  label, 
  error, 
  className,
  ...props 
}: PremiumTextareaProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1">
          {label}
        </Label>
      )}
      <Textarea 
        className={cn(
          "min-h-[100px] sm:min-h-[120px] border rounded-xl sm:rounded-2xl font-bold text-omuto-navy bg-white",
          error && "border-omuto-red",
          className
        )} 
        {...props} 
      />
      {error && <p className="text-omuto-red text-xs font-bold pt-1">{error}</p>}
    </div>
  );
}

interface PremiumSelectProps {
  label?: string;
  error?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}

export function PremiumSelect({ 
  label, 
  error, 
  value, 
  onValueChange, 
  placeholder,
  children,
  className,
}: PremiumSelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="font-bold text-[10px] sm:text-xs uppercase tracking-wider pl-1">
          {label}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn(
          "h-12 sm:h-14 border rounded-xl sm:rounded-2xl font-bold text-omuto-navy bg-white",
          error && "border-omuto-red",
          className
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
      {error && <p className="text-omuto-red text-xs font-bold pt-1">{error}</p>}
    </div>
  );
}

interface PremiumSelectItemProps {
  value: string;
  children: React.ReactNode;
}

export function PremiumSelectItem({ value, children }: PremiumSelectItemProps) {
  return <SelectItem value={value}>{children}</SelectItem>;
}
