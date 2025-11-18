'use client';

import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertTriangle, Info, BellRing, Check } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useFirestore, useUser, useCollection, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, Timestamp, limit, writeBatch, doc, arrayUnion, orderBy, and, or, getDocs, onSnapshot } from 'firebase/firestore';
import type { Alert as AlertType } from '@/lib/types';
import Link from 'next/link';
import { formatDateSafe } from '@/lib/utils';
import { subDays } from 'date-fns';

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


interface NotificationsListProps {
  isPage?: boolean;
  onUnreadStatusChange?: (hasUnread: boolean) => void;
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationsList({ isPage = false, onUnreadStatusChange, onUnreadCountChange }: NotificationsListProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
      if (!user) setIsLoading(false);
      return;
    }

    const threeDaysAgo = Timestamp.fromDate(subDays(new Date(), 3));
    const lim = isPage ? 50 : 5;
    
    const q = query(
        collection(firestore, 'alerts'),
        and(
            or(
                where('targetUserIds', 'array-contains', user.uid),
                where('targetUserIds', '==', [])
            ),
            where('createdAt', '>=', threeDaysAgo)
        ),
        orderBy('createdAt', 'desc'),
        limit(lim)
    );

    const unsubscribe = onUnreadStatusChange
      ? onSnapshot(q, (snapshot) => {
          const fetchedAlerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlertType));
          setAlerts(fetchedAlerts);
          setIsLoading(false);
        }, (error) => {
          console.error("Failed to subscribe to alerts:", error);
          setIsLoading(false);
        })
      : () => {};

      if (!onUnreadStatusChange) {
        getDocs(q).then(snapshot => {
             const fetchedAlerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlertType));
             setAlerts(fetchedAlerts);
             setIsLoading(false);
        }).catch(error => {
             console.error("Failed to fetch alerts:", error);
             setIsLoading(false);
        });
      }

    return () => onUnreadStatusChange && unsubscribe();
  }, [user, firestore, isPage, onUnreadStatusChange]);

  const unreadCount = useMemo(() => {
    if (!alerts || !user) return 0;
    return alerts.filter(alert => !alert.readBy?.includes(user.uid)).length;
  }, [alerts, user]);

  useEffect(() => {
    onUnreadStatusChange?.(unreadCount > 0);
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadStatusChange, onUnreadCountChange]);
  
  const handleMarkAsRead = async (alertId: string) => {
    if (!user || !firestore) return;

    const alertRef = doc(firestore, 'alerts', alertId);
    try {
      await updateDocumentNonBlocking(alertRef, {
        readBy: arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };


  if (isPage) {
    return (
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>A chronological log of all system alerts from the last 3 days.</CardDescription>
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

  // Dropdown view
  return (
    <div className="p-1">
        {isLoading && (
            <div className="p-2 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {alerts && alerts.length > 0 ? (
            alerts.map(alert => {
                const isUnread = user ? !alert.readBy?.includes(user.uid) : false;
                return (
                     <div key={alert.id} className="flex gap-3 py-2 px-2 rounded-md hover:bg-accent/50 w-full items-start">
                        <div className="mt-1">{alertIcons[alert.type]}</div>
                        <div className="flex-1">
                            <p className="text-sm font-medium leading-snug whitespace-normal">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDateSafe(alert.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                             {isUnread && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleMarkAsRead(alert.id); }}>
                                    <Check className="h-4 w-4" />
                                </Button>
                            )}
                            <Button asChild variant="secondary" size="sm">
                                <Link href={alert.action}>View</Link>
                            </Button>
                        </div>
                    </div>
                )
            })
        ) : (
            !isLoading && <p className="p-4 text-sm text-center text-muted-foreground">No new notifications.</p>
        )}
    </div>
  );
}
