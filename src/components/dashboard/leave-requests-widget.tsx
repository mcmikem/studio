'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Check, X, Calendar } from 'lucide-react';
import { formatDateSafe } from '@/lib/utils';
import Link from 'next/link';

interface LeaveRequestsWidgetProps {
  compact?: boolean;
}

export function LeaveRequestsWidget({ compact = false }: LeaveRequestsWidgetProps) {
  const firestore = useFirestore();

  const leaveQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'leave-requests'),
      where('status', '==', 'Pending'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [firestore]);

  const { data: leaveRequests, isLoading } = useCollection(leaveQuery);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!leaveRequests || leaveRequests.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-full bg-green-100">
            <Check className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-bold">All Clear</p>
            <p className="text-xs text-muted-foreground">No pending leave requests</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={compact ? '' : 'border-amber-200 bg-amber-50'}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-bold">Leave Requests</span>
          </div>
          <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
            {leaveRequests.length} pending
          </span>
        </div>
        
        {compact ? (
          <div className="space-y-1">
            {leaveRequests.slice(0, 3).map(request => (
              <div key={request.id} className="flex items-center justify-between text-xs">
                <span className="truncate">{request.userName || 'Staff'}</span>
                <span className="text-muted-foreground">{formatDateSafe(request.startDate, 'dateOnly')}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {leaveRequests.slice(0, 4).map(request => (
              <div key={request.id} className="flex items-center justify-between p-2 rounded bg-white border">
                <div>
                  <p className="text-sm font-bold truncate">{request.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateSafe(request.startDate, 'dateOnly')} - {formatDateSafe(request.endDate, 'dateOnly')}
                  </p>
                </div>
                <Button asChild size="sm" variant="ghost" className="h-8">
                  <Link href={`/hr/leave?request=${request.id}`}>Review</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <Button variant="outline" size="sm" asChild className="w-full mt-3">
          <Link href="/hr/leave">View All Requests</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
