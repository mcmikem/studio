
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ClipboardEdit, LogOut, BarChart3, Receipt, LogIn, Megaphone, ArrowRight, School, UserPlus, Users, Leaf, Heart, FileText } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import type { Program } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

const programForms: { [key: string]: { href: string; title: string; description: string; icon: React.ElementType }[] } = {
    'RED Campaign': [
        { href: '/meal/red-campaign', title: 'Log RED Campaign Activity', description: 'Log a new ROI activity specifically for the RED Campaign.', icon: BarChart3 },
        { href: '/meal/red-campaign/school-visit', title: 'School Visit M&E Form', description: 'Log observations and feedback from a school visit.', icon: Heart },
    ],
    'GreenSchools Campaign': [
         { href: '/meal/greenschools', title: 'Log GreenSchools Activity', description: 'Log a new ROI activity specifically for GreenSchools.', icon: BarChart3 },
         { href: '/meal/greenschools/tree-survey', title: 'Tree Survival Survey', description: 'Log follow-up data on a previous tree planting activity.', icon: Leaf },
    ],
     'YoSkills Entrepreneurship': [
        { href: '/meal/yoskills', title: 'Log YoSkills Activity', description: 'Log a new ROI activity for the YoSkills program.', icon: BarChart3 },
    ],
};

const generalMneForms = [
    {
        href: '/meal/baseline-survey',
        title: 'Baseline Survey',
        description: 'Capture "before the program" status for a beneficiary.',
        icon: FileText,
    },
    {
        href: '/meal/endline-survey',
        title: 'Endline Survey',
        description: 'Capture "after the program" status to measure impact.',
        icon: FileText,
    },
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
        return allPrograms.filter(p => p.status !== 'Completed');
    }, [allPrograms]);


    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight">M&E and Data Collection Hub</h1>
                <p className="text-muted-foreground">
                    A central place for all program-specific data collection forms.
                </p>
            </header>

             <Card>
                <CardHeader>
                    <CardTitle>General M&E Forms</CardTitle>
                    <CardDescription>Cross-cutting forms for beneficiary-level data.</CardDescription>
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
            
            {!isLoading && programs && programs.map(program => (
                <Card key={program.id}>
                    <CardHeader>
                        <CardTitle>{program.title}</CardTitle>
                        <CardDescription>Data collection forms for the {program.title}.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(programForms[program.title] || []).map(form => (
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
                         {(!programForms[program.title] || programForms[program.title].length === 0) && (
                            <Link href={`/forms/activity?programId=${program.id}&programName=${encodeURIComponent(program.title)}`} className="block">
                                <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                                    <BarChart3 className="h-8 w-8 text-primary flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Log General Activity (ROI)</p>
                                        <p className="text-sm text-muted-foreground">Submit a standard ROI activity report for this program.</p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
                                </div>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ))}

             <Card>
                <CardHeader>
                    <CardTitle>General Forms</CardTitle>
                    <CardDescription>Cross-cutting forms for general data entry.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/forms/activity" className="block">
                        <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                            <BarChart3 className="h-8 w-8 text-primary flex-shrink-0" />
                            <div>
                                <p className="font-semibold">General Activity Log (ROI)</p>
                                <p className="text-sm text-muted-foreground">Log an activity that is not tied to a specific program.</p>
                            </div>
                             <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
                        </div>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

    