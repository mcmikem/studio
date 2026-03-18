
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Briefcase, Handshake, Target, Receipt, FolderKanban, CalendarClock, Box, ListChecks, DollarSign, Users, FileSignature, Bug, Camera, ChevronDown } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser } from '@/firebase';
import { useViewAs } from '@/hooks/use-view-as';
import { useState } from 'react';


export default function ManagementLayoutComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { viewAsRole } = useViewAs();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const effectiveRole = viewAsRole || profile?.role;

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
    { name: 'Programs', href: '/management/programs', icon: FolderKanban },
    { name: 'Projects', href: '/management/projects', icon: Briefcase },
    { name: 'Partnerships', href: '/management/partnerships', icon: Handshake },
    { name: 'Content', href: '/management/content', icon: Camera, roles: ['Executive Director', 'Media & Finance Lead', 'Media & Communications Lead', 'Administrator'] },
    { name: 'Resources', href: '/management/resources', icon: DollarSign, roles: ['Executive Director', 'Resource Mobilization Lead', 'Administrator'] },
    { name: 'Op. Plan', href: '/management/operational-plan', icon: FileSignature, roles: ['Executive Director', 'Programs & Partnerships Manager', 'Administrator'] },
    { name: 'Finance', href: '/management/finance', icon: DollarSign, roles: ['Executive Director', 'Media & Finance Lead', 'Media & Communications Lead', 'Administrator'] },
    { name: 'Expenses', href: '/management/expenses', icon: Receipt, roles: ['Executive Director', 'Media & Finance Lead', 'Media & Communications Lead', 'Administrator', 'Programs & Partnerships Manager', 'Operations & Field Manager'] },
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

  const activeTab = tabs.find(tab => pathname.startsWith(tab.href));
  const inactiveTabs = tabs.filter(tab => !pathname.startsWith(tab.href));

  return (
    <div className="flex flex-col gap-4">
       <div className="border-b border-border -mx-4 px-4">
          <div className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap snap-start',
                    pathname.startsWith(tab.href)
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span>{tab.name}</span>
                </Link>
              ))}
            </div>
      </div>
      <div className="-mx-4 px-4">{children}</div>
    </div>
  );
}
