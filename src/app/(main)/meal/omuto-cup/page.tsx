
'use client';

import { Suspense } from 'react';
import { Loader2, Swords, UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const omutoCupForms = [
  {
    href: '/meal/omuto-cup/tournament-registration',
    title: 'Tournament Registration',
    description: 'Register a new team for the Omuto Cup tournament.',
    icon: Swords,
  },
  {
    href: '/meal/omuto-cup/volunteer-registration',
    title: 'Volunteer Registration',
    description: 'Register a new volunteer for the Omuto Cup event.',
    icon: UserPlus,
  },
];

function OmutoCupHubPage() {
    return (
        <div className="space-y-6">
            <header>
                 <Button variant="outline" asChild className="mb-4">
                    <Link href="/meal">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to MEAL Hub
                    </Link>
                </Button>
                <h1 className="font-heading text-3xl font-bold tracking-tight">Omuto Cup (Event)</h1>
                <p className="text-muted-foreground">
                    Data collection forms for managing the Omuto Cup tournament.
                </p>
            </header>
             <Card>
                <CardHeader>
                    <CardTitle>Omuto Cup Forms</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {omutoCupForms.map(form => (
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

export default function OmutoCupPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <OmutoCupHubPage />
        </Suspense>
    )
}
