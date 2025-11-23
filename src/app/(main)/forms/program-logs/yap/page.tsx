
'use client';

import { Suspense } from 'react';
import { Loader2, Users, FileText, FileUp, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const yapForms = [
  {
    href: '/forms/program-logs/yap/chapter-registration',
    title: 'Chapter Registration',
    description: 'Register a new Youth Action Pathway chapter.',
    icon: Users,
  },
  {
    href: '/forms/program-logs/yap/monthly-report',
    title: 'Chapter Monthly Report',
    description: 'Log monthly activities, outcomes, and challenges for a chapter.',
    icon: FileText,
  },
  {
    href: '/forms/program-logs/yap/seed-grant-application',
    title: 'Seed Grant Application',
    description: 'Apply for a seed grant for a youth-led project.',
    icon: DollarSign,
  },
  {
    href: '/forms/program-logs/yap/grant-accountability',
    title: 'Grant Accountability',
    description: 'Submit accountability reports for received seed grants.',
    icon: FileUp,
  },
];

function YAPHubPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Youth Action Pathway (YAP)</h1>
                <p className="text-muted-foreground">
                    Forms for managing YAP chapters and seed grants.
                </p>
            </header>
             <Card>
                <CardHeader>
                    <CardTitle>YAP Forms</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {yapForms.map(form => (
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

export default function YAPPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <YAPHubPage />
        </Suspense>
    )
}
