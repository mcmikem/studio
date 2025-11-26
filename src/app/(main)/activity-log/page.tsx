'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { History, User, Calendar, DollarSign, AreaChart } from 'lucide-react';
import type { Activity } from '@/lib/types';
import { formatDateSafe, formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';


export default function ActivityLogPage() {
  const activitiesQuery = useMemoFirebase((db) => {
    return query(collection(db, 'activities'), orderBy('loggedAt', 'desc'));
  }, []);

  const { data: activities, isLoading } = useCollection<Activity>(activitiesQuery);
  

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
            <AreaChart className="h-8 w-8" />
            Activity Log (ROI)
        </h1>
        <p className="text-muted-foreground">
          A financial and data-driven log of all activities reported via the ROI Calculator.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
          {/* Mobile View */}
          <div className="space-y-4 sm:hidden">
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
            {activities && activities.length > 0 ? (
                activities.map((activity) => (
                  <Card key={activity.id}>
                    <CardHeader>
                      <CardTitle>{activity.title}</CardTitle>
                      <CardDescription>by {activity.userName}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                       <div className="flex items-center text-muted-foreground">
                         <Calendar className="h-4 w-4 mr-2" />
                         <span>{formatDateSafe(activity.loggedAt)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center pt-2">
                        <div>
                          <p className="font-bold text-lg">{formatCurrency(activity.actualCost)}</p>
                          <p className="text-xs text-muted-foreground">Actual Cost</p>
                        </div>
                         <div>
                          <p className="font-bold text-lg">{formatCurrency(activity.totalValue)}</p>
                          <p className="text-xs text-muted-foreground">Total Value</p>
                        </div>
                        <div>
                          <Badge
                            className={`text-lg font-bold w-full justify-center ${
                              activity.finalRoi >= 0
                                ? 'border-green-500 bg-green-500/10 text-green-500'
                                : 'border-red-500 bg-red-500/10 text-red-500'
                            }`}
                            variant="outline"
                          >
                            {activity.finalRoi.toFixed(0)}%
                          </Badge>
                           <p className="text-xs text-muted-foreground mt-1">Final ROI</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
                 !isLoading && (
                  <EmptyState 
                    icon={History}
                    title="No Activities Logged"
                    description="Activities logged via the ROI Calculator will appear here."
                  >
                     <Button asChild className="mt-4">
                        <Link href="/forms/program-logs/general">Log First Activity</Link>
                    </Button>
                  </EmptyState>
                )
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Logged By</TableHead>
                  <TableHead>Actual Cost</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Final ROI</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    </TableRow>
                  ))}
                {activities && activities.length > 0 ? (
                  activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.title}</TableCell>
                      <TableCell>{activity.userName}</TableCell>
                      <TableCell>{formatCurrency(activity.actualCost)}</TableCell>
                      <TableCell>{formatCurrency(activity.totalValue)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            activity.finalRoi >= 0
                              ? 'border-green-500 bg-green-500/10 text-green-500'
                              : 'border-red-500 bg-red-500/10 text-red-500'
                          }
                          variant="outline"
                        >
                          {activity.finalRoi.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDateSafe(activity.loggedAt)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  !isLoading && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-48 text-center text-muted-foreground"
                      >
                          <EmptyState
                            icon={History}
                            title="No Activities Logged"
                            description="Activities logged via the ROI Calculator in the 'Forms Hub' will appear here."
                            className="min-h-0"
                          >
                            <Button asChild className="mt-4" variant="outline">
                                <Link href="/forms/program-logs/general">Log First Activity</Link>
                            </Button>
                          </EmptyState>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
