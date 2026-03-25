import React from 'react';
import { cn } from '@/lib/utils';

interface StickyFormFooterProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

/**
 * A premium, mobile-first sticky footer for form actions.
 * Sticks to the bottom on mobile/small screens and flows naturally on larger screens,
 * or stays sticky depending on the usage.
 */
export function StickyFormFooter({ children, className, containerClassName }: StickyFormFooterProps) {
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-t-2 border-omuto-navy/5 p-4 pb-safe-bottom sm:relative sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:p-0",
      containerClassName
    )}>
      <div className={cn(
        "max-w-7xl mx-auto flex items-center justify-end gap-3",
        className
      )}>
        {children}
      </div>
    </div>
  );
}
