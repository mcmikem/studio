
'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { collection, query, where, orderBy, limit, Timestamp, getDocs } from 'firebase/firestore';
import { CalendarCheck, Loader2 } from 'lucide-react';
import type { WeeklyWorkplan } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { startOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';

export function MyWeeklyPlan() {
  const { user } = useUser();
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyWorkplan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const weeklyPlanQuery = useMemoFirebase((db) => {
    if (!user) return null;
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    start.setHours(0,0,0,0);
    const weekStartTimestamp = Timestamp.fromDate(start);

    return query(
      collection(db, 'workplans'),
      where('userId', '==', user.uid),
      where('weekOf', '==', weekStartTimestamp),
      limit(1)
    );
  }, [user?.uid]);

  const { data, isLoading: isLoadingCollection } = useCollection<WeeklyWorkplan>(weeklyPlanQuery);
  
  useEffect(() => {
    setIsLoading(isLoadingCollection);
    if (data) {
        setWeeklyPlan(data[0] || null);
    }
  }, [data, isLoadingCollection]);


  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <Link href="/workplan">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            My Weekly Plan
          </CardTitle>
          <CardDescription>Your specific tasks for this week.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {isLoading ? (
            <>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-5 w-2/3" />
            </>
          ) : weeklyPlan && weeklyPlan.individualTasks.length > 0 ? (
            weeklyPlan.individualTasks.slice(0, 4).map((task, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-primary"></div>
                <span>{task}</span>
              </div>
            ))
          ) : (
             <div className="text-center py-4">
                <p className="text-muted-foreground">You haven't finalized your workplan for this week.</p>
                 <Button variant="link">Set your plan now!</Button>
            </div>
          )}
          {weeklyPlan && weeklyPlan.individualTasks.length > 4 && (
             <p className="text-xs text-primary pt-2">View all {weeklyPlan.individualTasks.length} tasks →</p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
