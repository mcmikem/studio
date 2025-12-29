
'use client';

import { Suspense } from 'react';
import { Loader2, Users, FileText, Swords, BarChart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ofaDataViews = [
  {
    href: '/data/ofa/teams',
    title: 'Registered Teams',
    description: 'View all teams registered in the Omuto Football Alliance.',
    icon: Swords,
  },
  {
    href: '/data/ofa/players',
    title: 'Registered Players',
    description: 'Browse the database of all registered players.',
    icon: Users,
  },
  {
    href: '/data/ofa/matches',
    title: 'Match Results',
    description: 'See the results and details of all logged matches.',
    icon: FileText,
  },
  {
    href: '/data/ofa/scorecards',
    title: 'Quarterly Scorecards',
    description: 'Review the performance scorecards for all teams.',
    icon: BarChart,
  },
];

function OFAPage() {
    return (
        <div className="space-y-6">
            <header>
                 <Button variant="outline" asChild className="mb-4">
                    <Link href="/data">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Data Hub
                    </Link>
                </Button>
                <h1 className="font-headline text-3xl font-bold tracking-tight">OFA Data Hub</h1>
                <p className="text-muted-foreground">
                    View and analyze all data collected for the Omuto Football Alliance.
                </p>
            </header>
             <Card>
                <CardHeader>
                    <CardTitle>OFA Data Views</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ofaDataViews.map(form => (
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

export default function OFADataHubPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <OFAPage />
        </Suspense>
    )
}
