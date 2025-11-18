
'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import type { Activity } from '@/lib/types';
import { BarChart3, TrendingUp, CircleDollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '../ui/empty-state';

interface UserPerformanceProps {
  userId: string;
}

export function UserPerformance({ userId }: UserPerformanceProps) {
  const firestore = useFirestore();

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    return query(
      collection(firestore, 'activities'),
      where('userId', '==', userId),
      where('loggedAt', '>=', Timestamp.fromDate(oneMonthAgo)),
      orderBy('loggedAt', 'desc')
    );
  }, [firestore, userId]);

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

  if (isLoading) {
    return <Skeleton className="h-48" />;
  }

  if (!activities || activities.length === 0) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Performance (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                  <EmptyState icon={BarChart3} title="No Activity" description="No activities logged in the last 30 days." className="min-h-0" />
              </CardContent>
          </Card>
      )
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
