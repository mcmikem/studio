
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, BarChart3, UserPlus, Users, CheckCircle, Trophy, Swords, Store, Wind, Droplets, Leaf, Zap, Heart } from 'lucide-react';
import Link from 'next/link';

const generalMneForms = [
    {
        href: '/meal/activity',
        title: 'General Activity (ROI)',
        description: 'Log any activity and calculate its financial and social return.',
        icon: BarChart3,
    },
    {
        href: '/meal/attendance',
        title: 'Session Attendance',
        description: 'Track participants reached in any session or event.',
        icon: Users,
    },
    {
        href: '/meal/beneficiary-registration',
        title: 'Beneficiary Registration',
        description: 'Create a new profile for a program beneficiary.',
        icon: UserPlus,
    },
    {
        href: '/meal/baseline-survey',
        title: 'Baseline Survey',
        description: 'Capture "before the program" status for a beneficiary.',
        icon: Users,
    },
    {
        href: '/meal/endline-survey',
        title: 'Endline Survey',
        description: 'Capture "after the program" status to measure impact.',
        icon: CheckCircle,
    },
    {
        href: '/meal/record-testimony',
        title: 'Impact Story Capture',
        description: 'Record a success story with before/after details and media.',
        icon: Trophy,
    }
];

const programSpecificForms = [
  { href: '/meal/red-campaign', title: 'RED Campaign', description: 'MHM, school visits, and pad distribution forms.', icon: Heart },
  { href: '/meal/greenschools', title: 'GreenSchools', description: 'Tree survival, waste audits, and club registration forms.', icon: Leaf },
  { href: '/meal/yoskills', title: 'YoSkills', description: 'Forms for circles, youth, and business ideas.', icon: Zap },
  { href: '/meal/slf', title: 'Student Leaders Forum', description: 'Manage schools, prefects, and performance for the SLF.', icon: Users },
  { href: '/meal/purewater', title: 'PureWater Initiative', description: 'Forms for water source mapping and WASH assessments.', icon: Droplets },
  { href: '/meal/yap', title: 'Youth Action Pathway (YAP)', description: 'Manage YAP chapters and seed grant applications.', icon: Users },
  { href: '/meal/ofa', title: 'Omuto Football Alliance', description: 'Manage teams, players, and matches for the league.', icon: Swords },
  { href: '/meal/omuto-cup', title: 'Omuto Cup (Event)', description: 'Data collection and management for the tournament.', icon: Trophy },
  { href: '/meal/essentials', title: 'Omuto Essentials', description: 'Manage production, sales, and inventory.', icon: Store },
  { href: '/meal/pulse', title: 'Omuto Pulse', description: 'Submit content for the media platform.', icon: Wind },
];


export default function MealPage() {
    return (
        <div className="space-y-8">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                    <BarChart3 className="h-8 w-8" />
                    M&E and Data Collection Hub
                </h1>
                <p className="text-muted-foreground">
                    Your central place for all data entry, reports, and logs.
                </p>
            </header>

             <Card>
                <CardHeader>
                    <CardTitle>General M&E Forms</CardTitle>
                    <CardDescription>Cross-cutting forms for beneficiary-level data and general activities.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {generalMneForms.map(form => (
                        <Link key={form.href} href={form.href} className="block">
                            <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                                <form.icon className="h-8 w-8 text-primary flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">{form.title}</p>
                                    <p className="text-sm text-muted-foreground">{form.description}</p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
                            </div>
                        </Link>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Program-Specific Forms</CardTitle>
                    <CardDescription>Data collection forms for specific programs and initiatives.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {programSpecificForms.map(form => (
                        <Link key={form.href} href={form.href} className="block">
                            <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                                <form.icon className="h-8 w-8 text-primary flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">{form.title}</p>
                                    <p className="text-sm text-muted-foreground">{form.description}</p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
                            </div>
                        </Link>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
