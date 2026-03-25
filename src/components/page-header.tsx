import React from 'react';
import type { LucideIcon } from 'lucide-react';
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
  children?: React.ReactNode;
}

export function PageHeader({ icon: Icon, title, description, breadcrumbs, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8 mt-2">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border-2 border-primary/20 shadow-comic-sm flex-shrink-0">
                <Icon className="h-6 w-6 text-primary" />
            </div>

            <div className="min-w-0 flex-1">
                {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                    {breadcrumbs.map((crumb, index) => (
                    <span key={crumb.href} className="inline-flex items-center gap-2">
                        <Link href={crumb.href} className="hover:text-primary transition-colors">
                        {crumb.name}
                        </Link>
                        {index < breadcrumbs.length - 1 && <span>/</span>}
                    </span>
                    ))}
                </nav>
                )}

                <h1 className="font-heading text-2xl font-black tracking-tight leading-none sm:text-3xl lg:text-4xl text-omuto-navy uppercase">
                {title}
                </h1>
                <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1.5 opacity-60">{description}</p>
            </div>
        </div>
        
        {children && (
            <div className="flex items-center gap-3">
                {children}
            </div>
        )}
    </div>
  );
}
