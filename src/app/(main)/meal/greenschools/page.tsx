
'use client';

import { Suspense } from 'react';
import { Loader2, Leaf, Users, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const greenSchoolsForms = [
  {
    href: '/meal/greenschools/tree-survey',
    title: 'Tree Survival Survey',
    description: 'Log follow-up data on a previous tree planting activity.',
    icon: Leaf,
  },
  {
    href: '/meal/greenschools/environmental-club',
    title: 'Environmental Club Registration',
    description: 'Register a new environmental club for the GreenSchools program.',
    icon: Users,
  },
  {
    href: '/meal/greenschools/waste-audit',
    title: 'Waste Audit Form',
    description: 'Conduct and log a waste audit for a school.',
    icon: Trash2,
  },
];

function GreenSchoolsHubPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight">GreenSchools Campaign</h1>
                <p className="text-muted-foreground">
                    Data collection and management forms for the GreenSchools program.
                </p>
            </header>
             <Card>
                <CardHeader>
                    <CardTitle>GreenSchools Forms</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {greenSchoolsForms.map(form => (
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

export default function GreenSchoolsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <GreenSchoolsHubPage />
        </Suspense>
    )
}
