
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser } from '@/firebase';
import { useViewAs } from '@/hooks/use-view-as';
import Link from 'next/link';
import { Briefcase, Handshake, Target, Receipt, FolderKanban, CalendarClock, Box, ListChecks, DollarSign, Users, FileSignature, ArrowRight } from 'lucide-react';

const managementLinks = [
    { name: 'Programs', href: '/management/programs', icon: FolderKanban, description: 'Define and track all core initiatives.' },
    { name: 'Projects', href: '/management/projects', icon: Briefcase, description: 'Monitor time-bound projects and their progress.' },
    { name: 'Partnerships', href: '/management/partnerships', icon: Handshake, description: 'Manage your CRM and partnership pipeline.' },
    { name: 'Expenses', href: '/management/expenses', icon: Receipt, description: 'Review, approve, and track all expense reports.' },
    { name: 'Users', href: '/management/users', icon: Users, description: 'Manage user roles and permissions.' },
    { name: 'Operational Plan', href: '/management/operational-plan', icon: FileSignature, description: 'Update the strategic objectives for the organization.' },
];


export default function ManagementPage() {
    const { user } = useUser();
    const { profile } = useUserProfile(user);
    const { viewAsRole } = useViewAs();
    
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
        return null; // The layout already handles the access denied message.
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Management Overview</CardTitle>
        <CardDescription>
          Select a module from the navigation above or use these quick links to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {managementLinks.map((link) => (
          <Link key={link.href} href={link.href} className="block">
            <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
              <link.icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold">{link.name}</p>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </div>
               <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto flex-shrink-0" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
