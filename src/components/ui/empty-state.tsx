

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  children
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-full min-h-[200px] rounded-lg border-2 border-dashed border-border text-center p-8 bg-card/50",
        className
      )}
    >
      <Icon className="h-12 w-12 text-muted-foreground" />
      <p className="mt-4 text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}