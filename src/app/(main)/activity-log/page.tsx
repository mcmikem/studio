
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Calendar, Loader2 } from 'lucide-react';
import type { Activity } from '@/lib/types';
import { formatDateSafe, formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';

export default function ActivityLogPage() {
  const [limitCount, setLimitCount] = useState(50);
  
  const activitiesQuery = useMemoFirebase((db) => {
    return query(collection(db, 'activities'), orderBy('loggedAt', 'desc'), limit(limitCount));
  }, [limitCount]);

  const { data: activities, isLoading } = useCollection<Activity>(activitiesQuery);

  return (
    <div className="flex flex-col gap-6">
       <PageHeader 
        icon={History}
        title="Activity Log (ROI)"
        description="A financial and data-driven log of all activities reported via the ROI Calculator."
      />
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading && !activities && Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="pt-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {activities && activities.length > 0 ? (
                activities.map((activity) => (
                  <Card key={activity.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-1"><span title={activity.title}>{activity.title}</span></CardTitle>
                      <CardDescription className="flex items-center justify-between">
                        <span className="truncate">by {activity.userName}</span>
                        <span className="flex items-center text-xs whitespace-nowrap ml-2">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDateSafe(activity.loggedAt, 'dateOnly')}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted/50 p-2 rounded-lg">
                          <p className="font-bold text-sm lg:text-base">{formatCurrency(activity.actualCost)}</p>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Actual</p>
                        </div>
                         <div className="bg-muted/50 p-2 rounded-lg">
                          <p className="font-bold text-sm lg:text-base">{formatCurrency(activity.totalValue)}</p>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Value</p>
                        </div>
                        <div className="flex flex-col justify-center">
                          <Badge
                            className={`text-sm lg:text-base font-bold w-full justify-center h-full ${
                              activity.finalRoi >= 0
                                ? 'border-green-500 bg-green-500/10 text-green-500'
                                : 'border-red-500 bg-red-500/10 text-red-500'
                            }`}
                            variant="outline"
                          >
                            {activity.finalRoi.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
                 !isLoading && (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <EmptyState 
                      icon={History}
                      title="No Activities Logged"
                      description="Activities logged via the ROI Calculator will appear here."
                    >
                      <Button asChild className="mt-4">
                          <Link href="/meal">Log First Activity</Link>
                      </Button>
                    </EmptyState>
                  </div>
                )
            )}
          </div>
          
          {activities && activities.length >= limitCount && (
            <div className="mt-8 flex justify-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setLimitCount((prev: number) => prev + 50)} 
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Load More Activities
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
