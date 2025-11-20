
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import type { Activity } from '@/lib/types';
import { BarChart3, TrendingUp, CircleDollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { startOfMonth } from 'date-fns';
import { EmptyState } from '../ui/empty-state';

export function MyPerformance() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    setIsClient(true);
  }, []);

  const activitiesQuery = useMemoFirebase(() => {
    // Defer query creation until we are on the client AND have a user.
    if (!firestore || !user || !isClient) return null;

    const monthStart = startOfMonth(new Date());

    return query(
      collection(firestore, 'activities'),
      where('userId', '==', user.uid),
      where('loggedAt', '>=', Timestamp.fromDate(monthStart)),
      orderBy('loggedAt', 'desc')
    );
  }, [firestore, user, isClient]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Performance (This Month)</CardTitle>
        <CardDescription>Your key contributions and efficiency.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4 text-center">
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
