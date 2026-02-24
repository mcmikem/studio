
'use client';

import { Suspense } from 'react';
import { Loader2, Package, DollarSign, List, ArrowLeft,ClipboardList, Users, Warehouse } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const essentialsLinks = [
  {
    href: '/enterprise/essentials/products',
    title: 'Products',
    description: 'Manage all finished goods and raw materials.',
    icon: Package,
  },
  {
    href: '#',
    title: 'Production',
    description: 'Create and track manufacturing batches.',
    icon: ClipboardList,
  },
  {
    href: '#',
    title: 'Sales',
    description: 'Record sales transactions for products.',
    icon: DollarSign,
  },
  {
    href: '#',
    title: 'Inventory',
    description: 'View current stock levels and make adjustments.',
    icon: Warehouse,
  },
  {
    href: '#',
    title: 'Suppliers',
    description: 'Manage suppliers for raw materials.',
    icon: Users,
  },
];

function EssentialsHubPage() {
    return (
        <div className="space-y-6">
            <header>
                 <Button variant="outline" asChild className="mb-4">
                    <Link href="/enterprise">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Enterprise Hub
                    </Link>
                </Button>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Omuto Essentials</h1>
                <p className="text-muted-foreground">
                    Manage production, sales, and inventory for the social enterprise.
                </p>
            </header>
             <Card>
                <CardHeader>
                    <CardTitle>Essentials Modules</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {essentialsLinks.map(form => (
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
