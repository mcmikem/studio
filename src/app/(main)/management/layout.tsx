'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Briefcase, Handshake } from 'lucide-react';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Programs', href: '/management/programs', icon: Briefcase },
    { name: 'Partnerships', href: '/management/partnerships', icon: Handshake },
  ];

  return (
    <div className="flex flex-col gap-6">
       <div className="border-b border-border">
        <div className="-mb-px flex items-center gap-4 px-4 sm:px-6">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
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
      <div>{children}</div>
    </div>
  );
}
