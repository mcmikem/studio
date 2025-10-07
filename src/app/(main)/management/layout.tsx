'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Briefcase, Handshake, Target, Receipt } from 'lucide-react';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Programs', href: '/management/programs', icon: Briefcase },
    { name: 'Projects', href: '/management/projects', icon: Briefcase },
    { name: 'Partnerships', href: '/management/partnerships', icon: Handshake },
    { name: 'Metrics', href: '/management/metrics', icon: Target },
    { name: 'Expenses', href: '/management/expenses', icon: Receipt },
  ];

  return (
    <div className="flex flex-col gap-6">
       <div className="border-b border-border">
        <div className="overflow-x-auto">
          <div className="flex items-center gap-4 px-4 sm:px-0 min-w-max">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                  pathname === tab.href
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
