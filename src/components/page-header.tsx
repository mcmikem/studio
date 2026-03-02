import React from 'react';
import type { LucideIcon } from "lucide-react";
import Link from 'next/link';

interface BreadcrumbItem {
    href: string;
    name: string;
}

interface PageHeaderProps {
    icon: LucideIcon;
    title: string;
    description: string;
    breadcrumbs?: BreadcrumbItem[];
}

export function PageHeader({ icon: Icon, title, description, breadcrumbs }: PageHeaderProps) {
  return (
    <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
            {breadcrumbs && breadcrumbs.length > 0 && (
                 <nav className="mb-1 text-sm text-muted-foreground">
                    {breadcrumbs.map((crumb, index) => (
                        <span key={crumb.href}>
                            <Link href={crumb.href} className="hover:text-primary">{crumb.name}</Link>
                            {index < breadcrumbs.length - 1 && <span className="mx-2">/</span>}
                        </span>
                    ))}
                </nav>
            )}
            <h1 className="font-headline text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </header>
  );
}
