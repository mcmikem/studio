
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertTriangle, Info, CheckCircle, BellRing } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Alert as AlertType } from '@/lib/types';
import Link from 'next/link';

const alertIcons: { [key: string]: React.ReactNode } = {
    Urgent: <AlertTriangle className="h-4 w-4 text-red-500" />,
    Reminder: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    Info: <Info className="h-4 w-4 text-blue-500" />,
};

const alertColors: { [key: string]: string } = {
    High: "border-red-500 bg-red-500/10 text-red-500",
    Medium: "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    Low: "border-blue-500 bg-blue-500/10 text-blue-500",
};


export function Alerts() {
  const firestore = useFirestore();
  const alertsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'alerts'), orderBy('createdAt', 'desc'), limit(5));
  }, [firestore]);

  const { data: alerts, isLoading } = useCollection<AlertType>(alertsQuery);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts & Notifications</CardTitle>
        <CardDescription>Urgent issues and important reminders.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
            Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                    <Skeleton className="h-5 w-5 mt-1" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-8 w-16 self-center" />
                </div>
            ))
        )}
        {alerts && alerts.length > 0 ? (
            alerts.map(alert => (
                 <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="mt-1">{alertIcons[alert.type]}</div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                         <Badge variant="outline" className={`mt-2 ${alertColors[alert.priority]}`}>{alert.priority} Priority</Badge>
                    </div>
                    <Button asChild variant="secondary" size="sm" className="self-center">
                        <Link href={alert.action}>View</Link>
                    </Button>
                </div>
            ))
        ) : (
            !isLoading && (
                 <div className="text-center text-muted-foreground py-8 flex flex-col items-center">
                    <BellRing className="h-10 w-10 mb-2" />
                    <p className="font-semibold">No new alerts</p>
                    <p className="text-sm">You're all caught up!</p>
                </div>
            )
        )}
      </CardContent>
    </Card>
  );
}
