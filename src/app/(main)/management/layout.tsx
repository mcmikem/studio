
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Briefcase, Handshake, Target, Receipt, FolderKanban, CalendarClock, Box, ListChecks, DollarSign, Users, FileSignature } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser } from '@/firebase';
import { useViewAs } from '@/hooks/use-view-as';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { viewAsRole } = useViewAs();
  
  const effectiveRole = viewAsRole || profile?.role;

  // The user's role is checked here to determine if they can see the management section at all.
  const managementRoles = [
      'Administrator', 
      'Executive Director', 
      'Programs & Partnerships Manager', 
      'Operations & Field Manager',
      'Media & Finance Lead',
      'Media & Communications Lead',
      'Resource Mobilization Lead',
  ];

  if (!managementRoles.includes(effectiveRole || '')) {
      return (
          <div className="flex flex-col gap-6">
              <h1 className="font-headline text-3xl font-bold tracking-tight">Access Denied</h1>
              <p className="text-muted-foreground">You do not have permission to view this section.</p>
          </div>
      )
  }

  const allTabs = [
    { name: 'Programs', href: '/management/programs' },
    { name: 'Projects', href: '/management/projects' },
    { name: 'Partnerships', href: '/management/partnerships' },
    { name: 'Resources', href: '/management/resources', roles: ['Executive Director', 'Resource Mobilization Lead', 'Administrator'] },
    { name: 'Operational Plan', href: '/management/operational-plan', roles: ['Executive Director', 'Programs & Partnerships Manager', 'Administrator'] },
    { name: 'Finance', href: '/management/finance', roles: ['Executive Director', 'Media & Finance Lead', 'Media & Communications Lead', 'Administrator'] },
    { name: 'Expenses', href: '/management/expenses', roles: ['Executive Director', 'Media & Finance Lead', 'Media & Communications Lead', 'Administrator', 'Programs & Partnerships Manager', 'Operations & Field Manager'] },
    { name: 'Metrics', href: '/management/metrics' },
    { name: 'Workplans', href: '/management/workplans' },
    { name: 'Equipment', href: '/management/equipment' },
    { name: 'Templates', href: '/management/templates' },
    { name: 'Users', href: '/management/users' },
  ];

  const tabs = allTabs.filter(tab => {
    if (!tab.roles) return true;
    return tab.roles.includes(effectiveRole || '');
  });

  return (
    <div className="space-y-6">
        <div className="border-b border-border">
            <div className="flex items-center gap-x-4 gap-y-2 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                <Link
                    key={tab.name}
                    href={tab.href}
                    className={cn(
                    'flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                    pathname.startsWith(tab.href)
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                >
                    {tab.name}
                </Link>
                ))}
            </div>
        </div>
        <div>{children}</div>
    </div>
  );
}

    