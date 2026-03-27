import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
  actionLabel?: string;
  actionOnClick?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
  actionLabel,
  actionOnClick,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[220px] rounded-3xl border-2 border-dashed border-omuto-navy/20 dark:border-white/20 text-center p-8 bg-omuto-cream/30 dark:bg-omuto-navy/10",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-white dark:bg-card border-2 border-omuto-navy dark:border-white/20 shadow-comic-sm flex items-center justify-center mb-6 text-omuto-navy dark:text-white relative">
         <div className="absolute inset-0 bg-omuto-yellow rounded-full -z-10 translate-x-1 translate-y-1 opacity-70"></div>
         <Icon className="h-8 w-8" />
      </div>
      <p className="text-xl font-heading font-black text-omuto-navy dark:text-white mb-2 tracking-tight">{title}</p>
      <p className="text-sm text-omuto-navy/70 dark:text-white/70 max-w-sm mb-6 pb-2">{description}</p>
      
      {actionLabel && actionOnClick && (
         <Button 
            onClick={actionOnClick} 
            className="btn-omuto font-bold bg-white dark:bg-omuto-navy text-omuto-navy dark:text-white border-omuto-navy dark:border-white/20 hover:bg-omuto-cream hover:-translate-y-1 hover:shadow-comic-md transition-all"
         >
            {actionLabel}
         </Button>
      )}
      {children}
    </div>
  );
}