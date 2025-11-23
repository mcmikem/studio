'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
     <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardEdit className="h-8 w-8" />
          Forms Hub
        </h1>
        <p className="text-muted-foreground">
          Your central place for all daily reports, and logs.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formLinks.map(link => (
          <Link href={link.href} key={link.href}>
            <Card className="hover:bg-muted/50 hover:border-primary/50 transition-all h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-4">
                    <link.icon className="h-8 w-8 text-primary" />
                    <CardTitle>{link.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>{link.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
