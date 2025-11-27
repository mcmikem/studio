'use client';

import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

export function PageHeader({ icon: Icon, title, description }: PageHeaderProps) {
  return (
    <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </header>
  );
}
