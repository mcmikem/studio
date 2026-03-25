import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OmutoLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function OmutoLoader({ size = 'md', className, label }: OmutoLoaderProps) {
  const dimensions = {
    sm: 40,
    md: 80,
    lg: 120,
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-6", className)}>
      <div className="relative group">
        {/* Outer pulse ring */}
        <div className={cn(
            "absolute inset-0 rounded-full bg-omuto-red/20 animate-ping duration-1000",
            size === 'sm' ? 'scale-150' : size === 'md' ? 'scale-125' : 'scale-110'
        )} />
        
        {/* Card-style container for the logo */}
        <div className={cn(
            "relative z-10 bg-white shadow-2xl rounded-3xl p-4 border-2 border-omuto-navy/5 overflow-hidden animate-bounce transition-transform duration-1000",
             size === 'sm' ? 'p-2 rounded-xl' : size === 'md' ? 'p-4 rounded-3xl' : 'p-6 rounded-[2.5rem]'
        )}>
             <Image 
                src="/logo.svg" 
                alt="Omuto Logo" 
                width={dimensions[size]} 
                height={dimensions[size]} 
                className="grayscale-0"
            />
             {/* Swiping shimmer highlight across the card */}
             <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent shadow-inner" />
        </div>
      </div>

      {label && (
        <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-omuto-navy animate-pulse">
                {label}
            </p>
            <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-omuto-red animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-omuto-red animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-omuto-red animate-bounce" />
            </div>
        </div>
      )}
    </div>
  );
}
