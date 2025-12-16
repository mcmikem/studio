
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Briefcase, Handshake, Target, Receipt, FolderKanban, CalendarClock, Box, ListChecks, DollarSign, Users, FileSignature } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser } from '@/firebase';
import { useViewAs } from '@/hooks/use-view-as';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const NavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string; }) => {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href);
    return (
        <Link href={href} className={cn(
            "flex flex-col items-center justify-center gap-2 p-4 border rounded-lg hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground",
            isActive && "bg-muted/80 text-foreground"
        )}>
            <Icon className="h-6 w-6" />
            <span className="text-sm font-medium">{label}</span>
        </Link>
    )
}

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
    { name: 'Programs', href: '/management/programs', icon: FolderKanban },
    { name: 'Projects', href: '/management/projects', icon: Briefcase },
    { name: 'Partnerships', href: '/management/partnerships', icon: Handshake },
    { name: 'Metrics', href: '/management/metrics', icon: Target },
    { name: 'Workplans', href: '/management/workplans', icon: CalendarClock },
    { name: 'Equipment', href: '/management/equipment', icon: Box },
    { name: 'Templates', href: '/management/templates', icon: ListChecks },
    { name: 'Users', href: '/management/users', icon: Users },
  ];

  const tabs = allTabs.filter(tab => {
    if ('roles' in tab) {
        // @ts-ignore
        return tab.roles.includes(effectiveRole || '');
    }
    return true;
  });

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
             {tabs.map((tab) => (
              <NavItem key={tab.name} href={tab.href} icon={tab.icon} label={tab.name} />
            ))}
        </div>
        <div>{children}</div>
    </div>
  );
}

