
'use client';

import { Suspense } from 'react';
import { Loader2, Swords, Trophy } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const talentsForms = [
  {
    href: '/talents/ofa',
    title: 'Omuto Football Alliance (OFA)',
    description: 'Manage teams, players, and matches for the league.',
    icon: Swords,
  },
  {
    href: '/talents/omuto-cup',
    title: 'Omuto Cup (Event)',
    description: 'Manage tournament registrations, check-ins, and results.',
    icon: Trophy,
  },
];

function TalentsHubPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Omuto Talents Project</h1>
                <p className="text-muted-foreground">
                    Data collection and management forms for our sports programs.
                </p>
            </header>
             <Card>
                <CardHeader>
                    <CardTitle>Talents Programs</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {talentsForms.map(form => (
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

export default function TalentsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <TalentsHubPage />
        </Suspense>
    )
}
