
'use client';

import { Suspense } from 'react';
import { Loader2, Trophy, Swords, Wind } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const talentHubs = [
  {
    href: '/meal/ofa',
    title: 'Omuto Football Alliance',
    description: 'Manage teams, players, and matches for the league.',
    icon: Swords,
  },
  {
    href: '/talents/omuto-cup',
    title: 'Omuto Cup (Event)',
    description: 'Data collection and management for the tournament.',
    icon: Trophy,
  },
  {
    href: '/talents/pulse',
    title: 'Omuto Pulse',
    description: 'Submit content for the media platform.',
    icon: Wind,
  },
];

function TalentsHubPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Omuto Talents</h1>
                <p className="text-muted-foreground">
                    A hub for all talent development programs including sports and media.
                </p>
            </header>
             <Card>
                <CardHeader>
                    <CardTitle>Talent Programs</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {talentHubs.map(form => (
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
