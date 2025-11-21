
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Program } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const programForms = [
  {
    programTitle: 'RED Campaign',
    href: '/meal/red-campaign',
    description: 'Log M&E data for RED Campaign activities (MHM sessions, pad distribution, etc.).',
  },
  {
    programTitle: 'GreenSchools Campaign',
    href: '/meal/greenschools',
    description: 'Log M&E data for GreenSchools activities (tree planting, club sessions, etc.).',
  },
  {
    programTitle: 'YoSkills Entrepreneurship',
    href: '/meal/yoskills',
    description: 'Log M&E data for YoSkills activities (trainings, business support, etc.).',
  },
];

export default function MealPage() {
  const firestore = useFirestore();
  const activeProgramsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'), where('status', '==', 'On Track'));
  }, [firestore]);

  const { data: activePrograms, isLoading } = useCollection<Program>(activeProgramsQuery);

  const availableForms = programForms.filter(form => 
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && (
          <>
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </>
        )}
        {!isLoading && availableForms.map(form => {
          const program = activePrograms?.find(p => p.title === form.programTitle);
          return (
            <Link href={`${form.href}?programId=${program?.id}`} key={form.href}>
              <Card className="hover:bg-muted/50 hover:border-primary/50 transition-all h-full flex flex-col">
                <CardHeader>
                  <CardTitle>{form.programTitle}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription>{form.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
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
