'use client';

import { cn } from '@/lib/utils';

interface MiniProgressProps {
  label: string;
  value: number;
  max?: number;
  color?: 'green' | 'blue' | 'purple' | 'amber' | 'red';
  showPercentage?: boolean;
  size?: 'sm' | 'md';
}

const colorClasses = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

export function MiniProgress({ 
  label, 
  value, 
  max = 100, 
  color = 'blue',
  showPercentage = true,
  size = 'md'
}: MiniProgressProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  
  const isLarge = size === 'md';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        {showPercentage && (
          <span className="font-bold">{percentage}%</span>
        )}
      </div>
      <div className={cn("bg-muted rounded-full overflow-hidden", isLarge ? "h-2" : "h-1.5")}>
        <div 
          className={cn("h-full transition-all duration-500", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isLarge && (
        <p className="text-[10px] text-muted-foreground">
          {value} of {max}
        </p>
      )}
    </div>
  );
}

export { MiniProgress as CompactProgressBar };
