
'use client';

import { Suspense } from 'react';
import { Loader2, UserPlus, FileText, Swords, BarChart, FileSearch, TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    href: '/meal/ofa/match-summary',
    title: 'Match Summary Sheet',
    description: 'Simplified report for District Meets.',
    icon: FileText,
  },
  {
    href: '/meal/ofa/advanced-analysis',
    title: 'Advanced Match Analysis',
    description: 'Detailed report for finals or tournament stages.',
    icon: FileSearch,
  },
  {
    href: '/meal/ofa/equipment-tracker',
    title: 'Equipment Impact Tracker',
    description: 'Track the impact of support given to teams.',
    icon: TrendingUp,
  },
  {
    href: '/meal/ofa/quarterly-scorecard',
    title: 'Quarterly Scorecard',
    description: "Log a team's quarterly progress and performance.",
    icon: BarChart,
  },
];

function OFAHubPage() {
    return (
        <div className="space-y-6">
            <header>
                 <Button variant="outline" asChild className="mb-4">
                    <Link href="/meal">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to MEAL Hub
                    </Link>
                </Button>
                <h1 className="font-heading text-3xl font-bold tracking-tight">Omuto Football Alliance (OFA)</h1>
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
