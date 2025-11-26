
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import type { Activity } from '@/lib/types';
import { BarChart3, TrendingUp, CircleDollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { startOfMonth, subMonths } from 'date-fns';
import { EmptyState } from '../ui/empty-state';
import Link from 'next/link';
import { useMemoFirebase } from '@/firebase/provider';

interface UserPerformanceProps {
  userId: string;
}

export function UserPerformance({ userId }: UserPerformanceProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const activitiesQuery = useMemoFirebase((db) => {
    if (!userId || !isClient) return null;

    const oneMonthAgo = subMonths(new Date(), 1);

    return query(
      collection(db, 'activities'),
      where('userId', '==', userId),
      where('loggedAt', '>=', Timestamp.fromDate(oneMonthAgo)),
      orderBy('loggedAt', 'desc')
    );
  }, [userId, isClient]);

  const { data: activities, isLoading } = useCollection<Activity>(activitiesQuery);

  const stats = useMemo(() => {
    if (!activities) {
      return {
        activityCount: 0,
        totalValue: 0,
        averageRoi: 0,
      };
    }
    const totalValue = activities.reduce((sum, act) => sum + act.totalValue, 0);
    const totalCost = activities.reduce((sum, act) => sum + act.actualCost, 0);
    const averageRoi = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
    
    return {
      activityCount: activities.length,
      totalValue,
      averageRoi,
    };
  }, [activities]);

  if (isLoading || !isClient) {
    return <Skeleton className="h-48" />;
  }

   if ((!isLoading && !activities) || (activities && activities.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Performance (Last 30 Days)</CardTitle>
          <CardDescription>Your key contributions and efficiency.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BarChart3}
            title="No Activity Logged"
            description="Log an activity via the Forms Hub to see your performance here."
            className="min-h-0 py-10"
          >
              <Link href="/forms/program-logs/general" className='mt-4 text-primary underline'>Log your first activity</Link>
          </EmptyState>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Performance (Last 30 Days)</CardTitle>
        </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-muted rounded-lg">
          <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{stats.activityCount}</p>
          <p className="text-xs text-muted-foreground">Activities Logged</p>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{formatCurrency(stats.totalValue, true)}</p>
          <p className="text-xs text-muted-foreground">Total Value</p>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <CircleDollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{stats.averageRoi.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">Average ROI</p>
        </div>
      </CardContent>
    </Card>
  );
}
