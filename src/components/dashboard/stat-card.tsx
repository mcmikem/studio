'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  color: string;
  alertLevel?: 'green' | 'yellow' | 'red';
  className?: string;
}

export function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  trendDirection = 'up',
  color, 
  alertLevel,
  className
}: StatCardProps) {
  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;
  const trendColor = trendDirection === 'up' ? 'text-emerald-600' : trendDirection === 'down' ? 'text-rose-600' : 'text-omuto-navy/40';
  const alertColors: Record<string, string> = {
    green: "bg-emerald-500",
    yellow: "bg-amber-500",
    red: "bg-rose-500"
  };

  return (
    <Card className={cn(
        "relative overflow-hidden border-2 border-omuto-navy/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-comic-sm rounded-[2rem]",
        className
    )}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-2.5 bg-muted/50 rounded-2xl shadow-sm ring-4 ring-muted/20", color)}>
            <Icon className="h-5 w-5" />
          </div>
          {alertLevel && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 rounded-full border border-omuto-navy/5">
                <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", alertColors[alertLevel] || 'bg-gray-400')} />
                <span className="text-[9px] font-black uppercase tracking-wider text-omuto-navy/40">{alertLevel}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-omuto-navy/30">{label}</h4>
          <p className="font-heading text-3xl font-black text-omuto-navy leading-none tracking-tight">{value}</p>
        </div>

        <div className="mt-4 pt-4 border-t border-omuto-navy/5 flex items-center gap-1.5">
            <TrendIcon className={`h-3 w-3 ${trendColor}`} />
            <span className={`text-[10px] font-black uppercase tracking-wider ${trendColor}/80`}>{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}
