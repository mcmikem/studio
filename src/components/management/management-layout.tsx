
'use client';

import { Bug } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Briefcase, Handshake, Target, FolderKanban, CalendarClock, Box, ListChecks, DollarSign, Users, FileSignature, Camera } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser } from '@/firebase';
import { useViewAs } from '@/hooks/use-view-as';


export default function ManagementLayoutComponent({
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
              <h1 className="font-heading text-3xl font-bold tracking-tight">Access Denied</h1>
              <p className="text-muted-foreground">You do not have permission to view this section.</p>
          </div>
      )
  }

  const allTabs = [
    { name: 'Projects', href: '/management/projects', icon: Briefcase },
    { name: 'Partnerships', href: '/management/partnerships', icon: Handshake },
    { name: 'Content', href: '/management/content', icon: Camera, roles: ['Executive Director', 'Media & Finance Lead', 'Media & Communications Lead', 'Administrator'] },
    { name: 'Resources', href: '/management/resources', icon: DollarSign, roles: ['Executive Director', 'Resource Mobilization Lead', 'Administrator'] },
    { name: 'Operational Plan', href: '/management/operational-plan', icon: FileSignature, roles: ['Executive Director', 'Programs & Partnerships Manager', 'Administrator'] },
    { name: 'Finance', href: '/finance/dashboard', icon: DollarSign, roles: ['Executive Director', 'Media & Finance Lead', 'Media & Communications Lead', 'Administrator'] },
    { name: 'Metrics', href: '/management/metrics', icon: Target },
    { name: 'Workplans', href: '/management/workplans', icon: CalendarClock },
    { name: 'Equipment', href: '/management/equipment', icon: Box },
    { name: 'Templates', href: '/management/templates', icon: ListChecks },
    { name: 'Users', href: '/management/users', icon: Users },
    { name: 'Feedback', href: '/management/feedback', icon: Bug },
  ];

  const tabs = allTabs.filter(tab => {
    if (!tab.roles) return true;
    return tab.roles.includes(effectiveRole || '');
  });

  return (
    <div className="flex flex-col gap-6">
       <div className="border-b border-border -mx-4 sm:-mx-6">
          <div className="flex flex-wrap items-stretch gap-1 px-4 sm:px-6 sm:gap-x-2">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={cn(
                    'flex min-w-0 flex-1 basis-[calc(50%-0.25rem)] items-center justify-center gap-2 border-b-2 px-2 py-2.5 text-xs font-medium transition-colors text-center sm:flex-none sm:basis-auto sm:justify-start sm:px-3 sm:text-sm sm:whitespace-nowrap',
                    pathname.startsWith(tab.href)
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="break-words leading-tight">{tab.name}</span>
                </Link>
              ))}
            </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
