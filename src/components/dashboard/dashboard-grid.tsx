
import { cn } from "@/lib/utils";

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardGrid({
  children,
  className,
}: DashboardGridProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-6", className)}>
      {children}
    </div>
  );
}

interface DashboardGroupProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  description?: string;
}

export function DashboardGroup({
  children,
  className,
  label,
  description,
}: DashboardGroupProps) {
  if (!label) {
    return <div className={cn("flex flex-col gap-6", className)}>{children}</div>;
  }
  return (
    <div className={cn("rounded-2xl border border-omuto-navy/10 bg-omuto-cream/20 p-6", className)}>
      {label && (
        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">{label}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      )}
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  );
}
