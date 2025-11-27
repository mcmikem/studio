
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, Heart, Leaf, Zap, Users, Droplets, Trophy, BarChart3, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Program } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

const programForms: { [key: string]: { href: string; title: string; description: string; icon: React.ElementType }[] } = {
    'RED Campaign': [
        { href: '/meal/red-campaign/school-visit', title: 'School Visit M&E Form', description: 'Log observations and feedback from a school visit.', icon: Users },
        { href: '/meal/red-campaign/pads-distribution', title: 'Pads Distribution Log', description: 'Record the distribution of sanitary pads.', icon: Droplets },
        { href: '/meal/red-campaign/mhm-training', title: 'MHM Training Report', description: 'Log details from a Menstrual Health Management session.', icon: Users },
    ],
    'GreenSchools Campaign': [
         { href: '/meal/greenschools/tree-survey', title: 'Tree Survival Survey', description: 'Log follow-up data on a previous tree planting activity.', icon: Leaf },
         { href: '/meal/greenschools/environmental-club', title: 'Environmental Club Registration', description: 'Register a new environmental club.', icon: Users },
         { href: '/meal/greenschools/waste-audit', title: 'Waste Audit Form', description: 'Conduct and log a waste audit for a school.', icon: Leaf },
    ],
     'YoSkills Entrepreneurship': [
        { href: '/meal/yoskills', title: 'YoSkills Hub', description: 'Access all forms related to YoSkills circles and businesses.', icon: Zap },
    ],
    'Student Leaders Forum': [
        { href: '/meal/slf', title: 'Student Leaders Forum Hub', description: 'Manage schools, prefects, and performance for the SLF.', icon: Users },
    ],
     'PureWater Initiative': [
        { href: '/meal/purewater', title: 'PureWater Hub', description: 'Forms for water source mapping and WASH assessments.', icon: Droplets },
    ],
    'Youth Action Pathway (YAP)': [
        { href: '/meal/yap', title: 'YAP Hub', description: 'Manage YAP chapters and seed grant applications.', icon: Users },
    ]
};

const generalMneForms = [
    {
        href: '/forms/program-logs/general',
        title: 'General Activity (ROI)',
        description: 'Log any activity and calculate its financial and social return.',
        icon: BarChart3,
    },
    {
        href: '/forms/attendance',
        title: 'Session Attendance',
        description: 'Track participants reached in any session or event.',
        icon: Users,
    },
    {
        href: '/forms/beneficiary-registration',
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
        icon: Users,
    },
    {
        href: '/record-testimony',
        title: 'Impact Story Capture',
        description: 'Record a success story with before/after details and media.',
        icon: Trophy,
    }
];

export default function MealPage() {
    const firestore = useFirestore();
    const programsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'programs'), orderBy('title'));
    }, [firestore]);
    
    const { data: allPrograms, isLoading } = useCollection<Program>(programsQuery);

    const programs = useMemo(() => {
        if (!allPrograms) return [];
        
        const uniquePrograms: Program[] = [];
        const seenTitles = new Set<string>();

        allPrograms.forEach(p => {
            if (p.status !== 'Completed' && programForms[p.title] && !seenTitles.has(p.title)) {
                uniquePrograms.push(p);
                seenTitles.add(p.title);
            }
        });

        return uniquePrograms;
    }, [allPrograms]);


    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                    <BarChart3 className="h-8 w-8" />
                    M&E and Data Collection Hub
                </h1>
                <p className="text-muted-foreground">
                    A central place for all program-specific data collection forms.
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


            {isLoading && (
                <div className="space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            )}
            
            {!isLoading && programs && programs.map(program => {
                const formsForProgram = programForms[program.title] || [];
                if (formsForProgram.length === 0) return null;

                return (
                    <Card key={program.id}>
                        <CardHeader>
                            <CardTitle>{program.title}</CardTitle>
                            <CardDescription>Data collection forms for the {program.title}.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formsForProgram.map(form => (
                                 <Link key={form.href} href={`${form.href}?programId=${program.id}`} className="block">
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
                );
            })}
        </div>
    );
}
