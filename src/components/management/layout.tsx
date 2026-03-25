'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Briefcase, Handshake, Target, Receipt, FolderKanban, CalendarClock, Box, ListChecks, DollarSign, Users, FileSignature, Bug, Camera, ChevronDown, Menu, X } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser } from '@/firebase';
import { useViewAs } from '@/hooks/use-view-as';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function ManagementLayoutComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { viewAsRole } = useViewAs();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
              <h1 className="font-heading text-3xl font-bold tracking-tight">Access Denied</h1>
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

  const activeTab = tabs.find(tab => pathname.startsWith(tab.href));

  return (
    <div className="w-full">
      {/* Mobile Navigation - Dropdown */}
      <div className="lg:hidden mb-4">
        <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between h-12 px-4">
              <span className="flex items-center gap-2">
                {activeTab ? <activeTab.icon className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                <span className="font-medium">{activeTab?.name || 'Select Section'}</span>
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full min-w-[100vw] max-w-[100vw]">
            {tabs.map((tab) => (
              <DropdownMenuItem key={tab.href} asChild>
                <Link
                  href={tab.href}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3',
                    pathname.startsWith(tab.href) && 'bg-muted font-medium'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Navigation - Horizontal Tabs */}
      <div className="hidden lg:block mb-6">
        <nav className="flex flex-wrap gap-1 p-1 bg-muted/50 rounded-lg w-fit">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                pathname.startsWith(tab.href)
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Page Content - Full width, properly contained */}
      <div className="w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
