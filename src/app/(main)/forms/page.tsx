
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ClipboardEdit, LogOut, BarChart3, Receipt, LogIn, Megaphone, ArrowRight, School, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';

const formLinks = [
   {
    href: '/forms/school',
    title: 'School Program Application',
    description: 'For schools to apply for Omuto programs.',
    icon: School,
    tab: 'school'
  },
  {
    href: '/forms/attendance',
    title: 'Session Attendance',
    description: 'Track participants reached in any session or event.',
    icon: Users,
  },
  {
    href: '/forms/beneficiary-registration',
    title: 'Beneficiary Registration',
    description: 'Create a new profile for a program beneficiary.',
    icon: UserPlus,
  },
  {
    href: '/forms/check-in',
    title: 'Daily Check-in',
    description: 'Plan your day and align with team goals.',
    icon: LogIn,
    tab: 'check-in'
  },
  {
    href: '/forms/check-out',
    title: 'Daily Check-out',
    description: 'Report your impact and share key learnings.',
    icon: LogOut,
    tab: 'check-out'
  },
  {
    href: '/forms/expense',
    title: 'Expense Report',
    description: 'Submit a new expense or request funds.',
    icon: Receipt,
    tab: 'expense'
  },
  {
    href: '/forms/alert',
    title: 'Create Alert',
    description: 'Broadcast an important message to the team.',
    icon: Megaphone,
    tab: 'alert'
  },
]


export default function FormsPage() {

  return (
    <div className="space-y-6">
      <header>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Forms Hub</h1>
          <p className="text-muted-foreground">Your central place for all daily reports, and logs.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formLinks.map(link => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:bg-muted/50 transition-colors h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                <link.icon className="h-8 w-8 text-primary" />
                <CardTitle>{link.title}</CardTitle>
                <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {link.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

    