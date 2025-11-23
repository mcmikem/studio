'use client';

import { Suspense } from 'react';
import { Loader2, Droplets, Map, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pureWaterForms = [
  {
    href: '/meal/purewater/water-source-mapping',
    title: 'Water Source Mapping',
    description: 'Log the location and status of a community water source.',
    icon: Map,
  },
  {
    href: '/meal/purewater/wash-assessment',
    title: 'WASH Assessment',
    description: 'Conduct a Water, Sanitation, and Hygiene assessment for a school.',
    icon: CheckSquare,
  },
];

function PureWaterHubPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight">PureWater Initiative</h1>
                <p className="text-muted-foreground">
                    Data collection and management forms for the PureWater program.
                </p>
            </header>
             <Card>
                <CardHeader>
                    <CardTitle>PureWater Forms</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pureWaterForms.map(form => (
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

export default function PureWaterPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PureWaterHubPage />
        </Suspense>
    )
}

