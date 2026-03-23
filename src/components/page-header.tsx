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
}

export function PageHeader({ icon: Icon, title, description, breadcrumbs }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
        <Icon className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
      </div>

      <div className="min-w-0 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.href} className="inline-flex items-center gap-2">
                <Link href={crumb.href} className="hover:text-primary break-words">
                  {crumb.name}
                </Link>
                {index < breadcrumbs.length - 1 && <span>/</span>}
              </span>
            ))}
          </nav>
        )}

        <h1 className="font-headline text-xl font-semibold tracking-tight leading-tight sm:text-2xl">
          {title}
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm break-words">{description}</p>
      </div>
    </header>
  );
}
