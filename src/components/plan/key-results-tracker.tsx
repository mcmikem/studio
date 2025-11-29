
'use client';

import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { KeyResult } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Goal } from 'lucide-react';
import { formatDateSafe } from '@/lib/utils';
import { isPast } from 'date-fns';

export function KeyResultsTracker() {
  const firestore = useFirestore();

  const keyResultsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'key-results'), orderBy('priority'), orderBy('deadline'));
  }, [firestore]);

  const { data: keyResults, isLoading } = useCollection<KeyResult>(keyResultsQuery);

  const formatTarget = (kr: KeyResult) => {
    if (kr.title?.includes('KR1')) return `${(kr.target / 1000000).toFixed(1)}M UGX`;
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
        <CardTitle>October Operational Plan: Key Results</CardTitle>
        <CardDescription>Live progress against our strategic objectives for the month.</CardDescription>
      </CardHeader>
      <CardContent>
        {keyResults && keyResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {keyResults.map(kr => {
              const progress = kr.target > 0 ? (kr.currentProgress / kr.target) * 100 : 0;
              const deadlinePast = isPast(new Date(kr.deadline));

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
            <EmptyState 
                icon={Goal}
                title="No Key Results Found"
                description="The operational plan has not been loaded. A manager can upload it in the management section."
            />
        )}
      </CardContent>
    </Card>
  );
}
