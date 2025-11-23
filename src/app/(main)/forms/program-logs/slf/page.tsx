
'use client';

import { Suspense } from 'react';
import { Loader2, Users, UserPlus, CheckSquare, BarChart } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const slfForms = [
  {
    href: '/forms/program-logs/slf/school-registration',
    title: 'School Registration',
    description: 'Register a new school for the Student Leaders Forum.',
    icon: Users,
  },
  {
    href: '/forms/program-logs/slf/prefect-registration',
    title: 'Prefect Registration',
    description: 'Register a new prefect from a participating school.',
    icon: UserPlus,
  },
  {
    href: '/forms/program-logs/slf/training-attendance',
    title: 'Training Attendance',
    description: 'Log attendance for an SLF training session.',
    icon: CheckSquare,
  },
  {
    href: '/forms/program-logs/slf/performance-tracking',
    title: 'Prefect Performance',
    description: 'Track the monthly performance of a student leader.',
    icon: BarChart,
  },
];

function SLFHubPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Student Leaders Forum (SLF)</h1>
                <p className="text-muted-foreground">
                    Data collection and management forms for the SLF program.
                </p>
            </header>
             <Card>
                <CardHeader>
                    <CardTitle>SLF Forms</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {slfForms.map(form => (
                         <Link key={form.href} href={form.href} className="block">
                            <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                                <form.icon className="h-8 w-8 text-primary flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">{form.title}</p>
                                    <p className="text-sm text-muted-foreground">{form.description}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export default function SLFPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SLFHubPage />
        </Suspense>
    )
}
