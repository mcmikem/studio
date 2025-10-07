'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertTriangle, Info, BellRing } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Alert as AlertType } from '@/lib/types';
import Link from 'next/link';
import { formatDateSafe } from '@/lib/utils';

const alertIcons: { [key: string]: React.ReactNode } = {
    Urgent: <AlertTriangle className="h-5 w-5 text-red-500" />,
    Reminder: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    Info: <Info className="h-5 w-5 text-blue-500" />,
};

const alertColors: { [key: string]: string } = {
    High: "border-red-500 bg-red-500/10 text-red-500",
    Medium: "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    Low: "border-blue-500 bg-blue-500/10 text-blue-500",
};


export function NotificationsList() {
  const firestore = useFirestore();
  const alertsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'alerts'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: alerts, isLoading } = useCollection<AlertType>(alertsQuery);


  return (
    <Card>
      <CardHeader>
        <CardTitle>All Notifications</CardTitle>
        <CardDescription>A chronological log of all system alerts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
            Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b">
                    <Skeleton className="h-6 w-6" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                     <Skeleton className="h-6 w-20" />
                </div>
            ))
        )}
        {alerts && alerts.length > 0 ? (
            alerts.map(alert => (
                 <div key={alert.id} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                    <div>{alertIcons[alert.type]}</div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                           {formatDateSafe(alert.createdAt)}
                        </p>
                    </div>
                     <Badge variant="outline" className={`${alertColors[alert.priority]}`}>{alert.priority}</Badge>
                    <Button asChild variant="secondary" size="sm">
                        <Link href={alert.action}>View</Link>
                    </Button>
                </div>
            ))
        ) : (
            !isLoading && (
                 <div className="text-center text-muted-foreground py-16 flex flex-col items-center">
                    <BellRing className="h-12 w-12 mb-4" />
                    <p className="font-semibold text-lg">No notifications</p>
                    <p className="text-sm">You're all caught up!</p>
                </div>
            )
        )}
      </CardContent>
    </Card>
  );
}
