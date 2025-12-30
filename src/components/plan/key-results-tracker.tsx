
'use client';

import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import type { KeyResult } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Goal, ArrowRight } from 'lucide-react';
import { formatDateSafe } from '@/lib/utils';
import { isPast, format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function KeyResultsTracker() {
  const firestore = useFirestore();
  const [currentMonth, setCurrentMonth] = React.useState('');

  React.useEffect(() => {
    setCurrentMonth(format(new Date(), 'MMMM yyyy'));
  }, []);

  const keyResultsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'key-results'), orderBy('priority'), orderBy('deadline'));
  }, [firestore]);

  const { data: keyResults, isLoading } = useCollection<KeyResult>(keyResultsQuery);

  const formatTarget = (kr: KeyResult) => {
    if (kr.title?.includes('KR1')) return `${((kr.target || 0) / 1000000).toFixed(1)}M UGX`;
    if (kr.target === 100) return `${kr.target}%`;
    return kr.target.toLocaleString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>{currentMonth} Operational Plan</CardTitle>
                <CardDescription>Live progress against our strategic objectives for the month.</CardDescription>
            </div>
            <Button asChild variant="secondary">
                <Link href="/management/operational-plan">
                    Update Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {keyResults && keyResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {keyResults.map(kr => {
              const progress = kr.target > 0 ? (kr.currentProgress / kr.target) * 100 : 0;
              // Ensure deadline is treated as a Date object if it's a Timestamp
              const deadlineDate = kr.deadline instanceof Timestamp ? kr.deadline.toDate() : new Date(kr.deadline);
              const deadlinePast = isPast(deadlineDate);

              return (
                <Card key={kr.id} className="flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{kr.title}</CardTitle>
                         <ProgressRing progress={progress} size={40} strokeWidth={4} />
                    </div>
                    <CardDescription>{kr.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="text-sm">
                        <p><span className="font-semibold">Target:</span> {formatTarget(kr)}</p>
                        <p className={deadlinePast ? 'text-destructive font-semibold' : ''}>
                          <span className="font-semibold">Deadline:</span> {formatDateSafe(kr.deadline, 'dateOnly')}
                        </p>
                     </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
            <div className="text-center p-8 bg-muted rounded-lg">
                <div className="mx-auto h-12 w-12 text-muted-foreground"><Goal/></div>
                <h3 className="mt-4 text-lg font-semibold">The {currentMonth} Plan is Not Set</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    You need to upload the operational plan to activate the dashboard for this month.
                </p>
                <Button asChild className="mt-4">
                    <Link href="/management/operational-plan">
                        Go to Plan Updater
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
