'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '../ui/button';
import { Briefcase, FolderKanban, Handshake, Target, Receipt, ArrowRight, DollarSign, CalendarClock, Box, ListChecks, Users } from 'lucide-react';
import Link from 'next/link';

const links = [
    { name: 'Programs', href: '/management/programs', icon: FolderKanban },
    { name: 'Projects', href: '/management/projects', icon: Briefcase },
    { name: 'Partnerships', href: '/management/partnerships', icon: Handshake },
    { name: 'Finance', href: '/management/finance', icon: DollarSign },
    { name: 'Expenses', href: '/management/expenses', icon: Receipt },
    { name: 'Metrics', href: '/management/metrics', icon: Target },
    { name: 'Workplans', href: '/management/workplans', icon: CalendarClock },
    { name: 'Equipment', href: '/management/equipment', icon: Box },
    { name: 'Templates', href: '/management/templates', icon: ListChecks },
    { name: 'Users', href: '/management/users', icon: Users },
]

export function ManagementQuickLinks() {
  return (
    <Card>
      <CardHeader>
          <CardTitle>Management</CardTitle>
          <CardDescription>
            Quick access to key management modules.
          </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {links.map(link => (
            <Button key={link.name} asChild variant="ghost" className="w-full justify-start">
                <Link href={link.href}>
                    <link.icon className="mr-2 h-4 w-4" />
                    {link.name}
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </Link>
            </Button>
        ))}
      </CardContent>
    </Card>
  );
}
