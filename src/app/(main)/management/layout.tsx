

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Briefcase, Handshake, Target, Receipt, FolderKanban, CalendarClock, Box, ListChecks, DollarSign, Users } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser } from '@/firebase';
import { useViewAs } from '@/hooks/use-view-as';


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
    { name: 'Programs', href: '/management/programs', icon: FolderKanban },
    { name: 'Projects', href: '/management/projects', icon: Briefcase },
    { name: 'Partnerships', href: '/management/partnerships', icon: Handshake },
    { name: 'Finance', href: '/management/finance', icon: DollarSign, roles: ['Executive Director', 'Media & Finance Lead'] },
    { name: 'Expenses', href: '/management/expenses', icon: Receipt, roles: ['Executive Director', 'Media & Finance Lead'] },
    { name: 'Metrics', href: '/management/metrics', icon: Target },
    { name: 'Workplans', href: '/management/workplans', icon: CalendarClock },
    { name: 'Equipment', href: '/management/equipment', icon: Box },
    { name: 'Templates', href: '/management/templates', icon: ListChecks },
    { name: 'Users', href: '/management/users', icon: Users },
  ];

  const tabs = allTabs.filter(tab => {
    // Then, we check which specific tabs within the section they can see.
    if (tab.roles) {
      return tab.roles.includes(effectiveRole || '');
    }
    // If a tab has no specific roles, it's visible to all management roles.
    const generalManagementRoles = [
      'Administrator', 
      'Executive Director', 
      'Programs & Partnerships Manager', 
      'Operations & Field Manager',
    ];
    return generalManagementRoles.includes(effectiveRole || '');
  });

  return (
    <div className="flex flex-col gap-6">
       <div className="border-b border-border">
        <div className="flex items-center gap-x-4 gap-y-2 p-2 flex-wrap">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap rounded-md',
                  pathname.startsWith(tab.href)
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
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
