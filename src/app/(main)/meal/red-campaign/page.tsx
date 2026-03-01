
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, ArrowRight, UserPlus, CalendarPlus, CheckSquare } from 'lucide-react';
import Link from 'next/link';

const redCampaignForms = [
    { href: '/meal/red-campaign/school-visit', title: 'School Visit Log', description: 'Record details of a visit to a school for the RED Campaign.', icon: CalendarPlus },
    { href: '/meal/red-campaign/mhm-training', title: 'MHM Training Session', description: 'Log a Menstrual Health Management training session.', icon: UserPlus },
    { href: '/meal/red-campaign/pads-distribution', title: 'Pads Distribution', description: 'Record the distribution of sanitary pads.', icon: CheckSquare },
];

export default function RedCampaignHubPage() {
  return (
    <div className="space-y-8">
        <PageHeader 
            icon={Droplets}
            title="RED Campaign"
            description="Data collection for the Menstrual Health Management program."
            breadcrumbs={[
                { href: '/meal', name: 'MEAL Hub' },
                { name: 'RED Campaign' },
            ]}
        />

        <Card className="bg-background border-lg shadow-comic-sm">
            <CardHeader>
                <CardTitle>Data Collection Forms</CardTitle>
                <CardDescription>Select a form to log data for the RED Campaign.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {redCampaignForms.map(link => (
                    <Link key={link.href} href={link.href} className="block group">
                        <div className="flex items-center gap-4 p-4 border-lg rounded-2xl bg-muted/30 hover:bg-primary/5 hover:border-primary/20 transition-all h-full">
                            <div className="p-3 bg-white rounded-xl border-lg">
                                <link.icon className="h-6 w-6 text-red-500" />
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
