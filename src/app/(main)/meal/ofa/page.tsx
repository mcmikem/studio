
'use client';

import { Suspense } from 'react';
import { Loader2, UserPlus, FileText, Swords } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ofaForms = [
  {
    href: '/meal/ofa/team-registration',
    title: 'Team Registration',
    description: 'Onboard a new team to the Omuto Football Alliance.',
    icon: Swords,
  },
  {
    href: '/meal/ofa/player-registration',
    title: 'Player Registration',
    description: 'Register a new player for a team in the alliance.',
    icon: UserPlus,
  },
  {
    href: '/meal/ofa/match-report',
    title: 'Match Report Form',
    description: 'Log the results and details of a completed match.',
    icon: FileText,
  },
];

function OFAHubPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Omuto Football Alliance (OFA)</h1>
                <p className="text-muted-foreground">
                    Manage teams, players, and matches for the league.
                </p>
            </header>
             <Card>
                <CardHeader>
                    <CardTitle>OFA Forms</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ofaForms.map(form => (
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

export default function OFAPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <OFAHubPage />
        </Suspense>
    )
}
