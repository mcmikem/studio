
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wind, ArrowRight, Map, CheckSquare } from 'lucide-react';
import Link from 'next/link';

const pureWaterForms = [
    { href: '/meal/purewater/water-source-mapping', title: 'Water Source Mapping', description: 'Map and assess a new water source in the community.', icon: Map },
    { href: '/meal/purewater/wash-assessment', title: 'WASH Assessment', description: 'Conduct a WASH (Water, Sanitation, and Hygiene) assessment at a school.', icon: CheckSquare },
];

export default function PureWaterHubPage() {
  return (
    <div className="space-y-8">
        <PageHeader 
            icon={Wind}
            title="PureWater"
            description="Data collection for the Water, Sanitation, and Hygiene (WASH) program."
            breadcrumbs={[
                { href: '/meal', name: 'MEAL Hub' },
                { name: 'PureWater' },
            ]}
        />

        <Card className="bg-background border-lg shadow-comic-sm">
            <CardHeader>
                <CardTitle>Data Collection Forms</CardTitle>
                <CardDescription>Select a form to log data for the PureWater program.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pureWaterForms.map(link => (
                    <Link key={link.href} href={link.href} className="block group">
                        <div className="flex items-center gap-4 p-4 border-lg rounded-2xl bg-muted/30 hover:bg-primary/5 hover:border-primary/20 transition-all h-full">
                            <div className="p-3 bg-white rounded-xl border-lg">
                                <link.icon className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold tracking-tight">{link.title}</p>
                                <p className="text-sm text-muted-foreground">{link.description}</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    </div>
  );
}
