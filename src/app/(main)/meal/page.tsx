
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { BarChart3, ArrowRight, Leaf, Heart, BookOpen, FileText } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Program } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const programForms = [
  {
    programTitle: 'RED Campaign',
    icon: Heart,
    forms: [
        { title: 'Log ROI Activity', href: '/meal/red-campaign', description: 'Log a general activity for ROI calculation.'},
        { title: 'School Visit M&E Form', href: '/meal/red-campaign/school-visit', description: 'Record observations from a school visit.'},
    ]
  },
  {
    programTitle: 'GreenSchools Campaign',
    icon: Leaf,
    forms: [
        { title: 'Log ROI Activity', href: '/meal/greenschools', description: 'Log a general activity for ROI calculation.'},
        { title: 'Tree Survival Survey', href: '/meal/greenschools/tree-survey', description: 'Conduct a follow-up on previously planted trees.'},
    ]
  },
  {
    programTitle: 'YoSkills Entrepreneurship',
    icon: BookOpen,
    forms: [
        { title: 'Log ROI Activity', href: '/meal/yoskills', description: 'Log a general activity for ROI calculation.'},
    ]
  },
];

export default function MealPage() {
  const firestore = useFirestore();
  const activeProgramsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'), where('status', '==', 'On Track'));
  }, [firestore]);

  const { data: activePrograms, isLoading } = useCollection<Program>(activeProgramsQuery);

  const availableProgramForms = programForms.filter(form => 
    activePrograms?.some(p => p.title === form.programTitle)
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          MEAL Hub
        </h1>
        <p className="text-muted-foreground">
          Central hub for Monitoring, Evaluation, Accountability, and Learning data collection.
        </p>
      </header>

      <div className="space-y-8">
        {isLoading && (
          <>
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </>
        )}
        {!isLoading && availableProgramForms.map(program => {
            const programData = activePrograms?.find(p => p.title === program.programTitle);
            return (
              <Card key={program.programTitle}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><program.icon className="h-6 w-6 text-primary" /> {program.programTitle}</CardTitle>
                    <CardDescription>Select a form to log data for this program.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {program.forms.map(form => (
                     <Link href={`${form.href}?programId=${programData?.id}`} key={form.href}>
                       <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors h-full">
                           <div>
                               <p className="font-semibold">{form.title}</p>
                               <p className="text-sm text-muted-foreground">{form.description}</p>
                           </div>
                           <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                       </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )
        })}
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Other Forms</CardTitle>
        </CardHeader>
        <CardContent>
            <Link href="/forms/school">
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                        <p className="font-semibold">School Program Application</p>
                        <p className="text-sm text-muted-foreground">For external schools to apply for Omuto programs.</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
            </Link>
        </CardContent>
      </Card>
    </div>
  );
}

    