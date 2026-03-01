
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, ArrowRight, Sprout, Recycle, School } from 'lucide-react';
import Link from 'next/link';

const greenSchoolsForms = [
    { href: '/meal/greenschools/environmental-club', title: 'Environmental Club Report', description: 'Log activities and membership for a school\'s environmental club.', icon: School },
    { href: '/meal/greenschools/tree-survey', title: 'Tree Survival Survey', description: 'Conduct a survey to track the survival rate of planted trees.', icon: Sprout },
    { href: '/meal/greenschools/waste-audit', title: 'Waste Audit Form', description: 'Perform a waste audit at a school to identify waste streams.', icon: Recycle },
];

export default function GreenSchoolsHubPage() {
  return (
    <div className="space-y-8">
        <PageHeader 
            icon={Leaf}
            title="Green Schools"
            description="Data collection for environmental and conservation programs."
            breadcrumbs={[
                { href: '/meal', name: 'MEAL Hub' },
                { name: 'Green Schools' },
            ]}
        />

        <Card className="bg-background border-lg shadow-comic-sm">
            <CardHeader>
                <CardTitle>Data Collection Forms</CardTitle>
                <CardDescription>Select a form to log data for the Green Schools program.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {greenSchoolsForms.map(link => (
                    <Link key={link.href} href={link.href} className="block group">
                        <div className="flex items-center gap-4 p-4 border-lg rounded-2xl bg-muted/30 hover:bg-primary/5 hover:border-primary/20 transition-all h-full">
                            <div className="p-3 bg-white rounded-xl border-lg">
                                <link.icon className="h-6 w-6 text-green-500" />
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
