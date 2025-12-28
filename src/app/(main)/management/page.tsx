

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Briefcase, Handshake, Target, Receipt, FolderKanban, CalendarClock, Box, ListChecks, DollarSign, Users, FileSignature } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser } from '@/firebase';
import { useViewAs } from '@/hooks/use-view-as';


export default function ManagementPage() {
  const pathname = usePathname();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { viewAsRole } = useViewAs();
  
  const effectiveRole = viewAsRole || profile?.role;

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
    <div className="flex flex-col gap-6">
      <p className="p-8 text-center text-muted-foreground">Select a management module above to begin.</p>
    </div>
  );
}
