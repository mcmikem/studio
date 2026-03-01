
'use client';

import type { LucideIcon } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from 'next/link';

interface PageHeaderProps {
    icon: LucideIcon;
    title: string;
    description: string;
    breadcrumbs?: { href: string; name: string; }[];
}

export function PageHeader({ icon: Icon, title, description, breadcrumbs }: PageHeaderProps) {
  return (
    <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
            {breadcrumbs && breadcrumbs.length > 0 && (
                 <Breadcrumb className="mb-1">
                    <BreadcrumbList>
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={crumb.href}>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={crumb.href}>{crumb.name}</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                            </React.Fragment>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            )}
            <h1 className="font-headline text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </header>
  );
}
