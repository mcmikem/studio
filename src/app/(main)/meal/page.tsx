'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, BarChart3, Users, CheckCircle, FileText, Swords, Leaf, Heart, Zap, Droplets, Store, Wind, Trophy } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const programSections = [
    { href: '/meal/ofa', title: 'Omuto Football Alliance', icon: Swords, dataHref: '/meal/data/ofa' },
    { href: '/meal/red-campaign', title: 'RED Campaign', icon: Heart, dataHref: '/meal/data/red-campaign' },
    { href: '/meal/greenschools', title: 'GreenSchools', icon: Leaf, dataHref: '/meal/data/greenschools' },
    { href: '/meal/yoskills', title: 'YoSkills', icon: Zap, dataHref: '/meal/data/yoskills' },
    { href: '/meal/slf', title: 'Student Leaders Forum', icon: Users, dataHref: '/meal/data/slf' },
    { href: '/meal/purewater', title: 'PureWater Initiative', icon: Droplets, dataHref: '/meal/data/purewater' },
    { href: '/meal/yap', title: 'Youth Action Pathway (YAP)', icon: Users, dataHref: '/meal/data/yap' },
    { href: '/meal/omuto-cup', title: 'Omuto Cup (Event)', icon: Trophy, dataHref: '/meal/data/omuto-cup' },
    { href: '/meal/essentials', title: 'Omuto Essentials', icon: Store, dataHref: '/meal/data/essentials' },
    { href: '/meal/pulse', title: 'Omuto Pulse', icon: Wind, dataHref: '/meal/data/pulse' },
];

export default function MealPage() {
    return (
        <div className="space-y-8">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                    <BarChart3 className="h-8 w-8" />
                    MEAL Hub
                </h1>
                <p className="text-muted-foreground">
                    A unified hub for all Monitoring, Evaluation, Accountability, and Learning activities.
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Program-Specific Tools</CardTitle>
                    <CardDescription>Select a program to add new data or view existing reports.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {programSections.map(form => (
                        <Card key={form.href} className="hover:shadow-md transition-shadow">
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                     <form.icon className="h-6 w-6 text-primary" />
                                     {form.title}
                                </CardTitle>
                             </CardHeader>
                             <CardContent className="flex flex-col gap-2">
                                <Button asChild variant="outline">
                                    <Link href={form.href}>Add Data <ArrowRight className="ml-auto h-4 w-4" /></Link>
                                </Button>
                                 <Button asChild variant="secondary">
                                    <Link href={form.dataHref}>View Data <ArrowRight className="ml-auto h-4 w-4" /></Link>
                                </Button>
                             </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>General M&amp;E Forms</CardTitle>
                    <CardDescription>Cross-cutting forms for beneficiary-level data and general activities.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/meal/activity" className="block">
                        <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                            <BarChart3 className="h-8 w-8 text-primary flex-shrink-0" />
                            <div>
                                <p className="font-semibold">General Activity (ROI)</p>
                                <p className="text-sm text-muted-foreground">Log any activity and calculate its financial and social return.</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
                        </div>
                    </Link>
                    <Link href="/meal/attendance" className="block">
                        <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                            <Users className="h-8 w-8 text-primary flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Session Attendance</p>
                                <p className="text-sm text-muted-foreground">Track participants reached in any session or event.</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
                        </div>
                    </Link>
                     <Link href="/meal/record-testimony" className="block">
                        <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                            <Trophy className="h-8 w-8 text-primary flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Impact Story Capture</p>
                                <p className="text-sm text-muted-foreground">Record a success story with before/after details and media.</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
                        </div>
                    </Link>
                </CardContent>
            </Card>

        </div>
    );
}
