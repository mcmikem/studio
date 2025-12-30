
'use client';

import { Suspense } from 'react';
import { Loader2, Package, DollarSign, List, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const essentialsForms = [
  {
    href: '/meal/essentials/production-log',
    title: 'Production Log',
    description: 'Log a new batch of products made.',
    icon: Package,
  },
  {
    href: '/meal/essentials/sales',
    title: 'Sales Tracking',
    description: 'Record a new sale to a customer or outlet.',
    icon: DollarSign,
  },
  {
    href: '/meal/essentials/inventory',
    title: 'Inventory Check',
    description: 'Perform a stock count of products.',
    icon: List,
  },
];

function EssentialsHubPage() {
    return (
        <div className="space-y-6">
            <header>
                 <Button variant="outline" asChild className="mb-4">
                    <Link href="/meal">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to MEAL Hub
                    </Link>
                </Button>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Omuto Essentials</h1>
                <p className="text-muted-foreground">
                    Manage production, sales, and inventory for the social enterprise.
                </p>
            </header>
             <Card>
                <CardHeader>
                    <CardTitle>Essentials Forms</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {essentialsForms.map(form => (
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

export default function EssentialsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <EssentialsHubPage />
        </Suspense>
    )
}
