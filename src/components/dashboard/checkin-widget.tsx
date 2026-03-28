'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, MapPin, PlayCircle, Coffee, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface CheckinStatus {
  id: string;
  userId: string;
  primaryMission?: string;
  timestamp?: { toDate: () => Date };
  location?: string;
}

interface CheckoutStatus {
  id: string;
  userId: string;
  timestamp?: { toDate: () => Date };
}

export function CheckinWidget() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [today] = useState(new Date());

  const checkinQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'checkins'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [firestore, user]);

  const checkoutQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'checkouts'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [firestore, user]);

  const { data: checkins, isLoading: isCheckinLoading } = useCollection(checkinQuery);
  const { data: checkouts, isLoading: isCheckoutLoading } = useCollection(checkoutQuery);

  const latestCheckin = checkins?.[0] as CheckinStatus | undefined;
  const latestCheckout = checkouts?.[0] as CheckoutStatus | undefined;

  const isCheckedIn = latestCheckin && (!latestCheckout || 
    (latestCheckin.timestamp?.toDate()?.getTime() || 0) > (latestCheckout.timestamp?.toDate()?.getTime() || 0));

  const checkinTime = latestCheckin?.timestamp?.toDate();
  const checkoutTime = latestCheckout?.timestamp?.toDate();

  const isLoading = isCheckinLoading || isCheckoutLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-2",
      isCheckedIn ? "border-green-200 bg-green-50" : "border-muted"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className={cn("h-4 w-4", isCheckedIn ? "text-green-600" : "text-muted-foreground")} />
            <span className="text-sm font-bold">Today's Status</span>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
            isCheckedIn 
              ? "bg-green-100 text-green-700" 
              : "bg-muted text-muted-foreground"
          )}>
            {isCheckedIn ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {isCheckedIn ? 'Checked In' : 'Not Checked In'}
          </div>
        </div>

        {isCheckedIn && latestCheckin && (
          <div className="space-y-2 mb-3">
            {latestCheckin.primaryMission && (
              <div className="flex items-center gap-2 text-sm">
                <PlayCircle className="h-4 w-4 text-blue-500" />
                <span className="font-medium truncate">{latestCheckin.primaryMission}</span>
              </div>
            )}
            {checkinTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Started at {format(checkinTime, 'h:mm a')}</span>
              </div>
            )}
            {latestCheckin.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{latestCheckin.location}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {isCheckedIn ? (
            <Button asChild className="flex-1" size="sm">
              <Link href="/forms/check-out">
                <Coffee className="h-4 w-4 mr-1" />
                Check Out
              </Link>
            </Button>
          ) : (
            <Button asChild className="flex-1 bg-green-600 hover:bg-green-700" size="sm">
              <Link href="/forms/check-in">
                <PlayCircle className="h-4 w-4 mr-1" />
                Check In
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/daily-plan">Plan</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
