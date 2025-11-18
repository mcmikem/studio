
'use client';

import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertTriangle, Info, BellRing } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, Timestamp, limit, writeBatch, doc, arrayUnion, orderBy, or, and } from 'firebase/firestore';
import type { Alert as AlertType } from '@/lib/types';
import Link from 'next/link';
import { formatDateSafe } from '@/lib/utils';
import { subDays } from 'date-fns';
import { DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from '../ui/dropdown-menu';

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
}

export function NotificationsList({ isPage = false, onUnreadStatusChange }: NotificationsListProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const alertsQuery = useMemo(() => {
    if (!user || !firestore) return null;

    const threeDaysAgo = Timestamp.fromDate(subDays(new Date(), 3));
    const lim = isPage ? 50 : 5;
    
    return query(
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
  }, [user, firestore, isPage]);

  const { data: alerts, isLoading } = useCollection<AlertType>(alertsQuery);

  const unreadCount = useMemo(() => {
    if (!alerts || !user) return 0;
    return alerts.filter(alert => !alert.readBy?.includes(user.uid)).length;
  }, [alerts, user]);

  useEffect(() => {
    onUnreadStatusChange?.(unreadCount > 0);
  }, [unreadCount, onUnreadStatusChange]);
  
  const handleMarkAsRead = async () => {
    if (!alerts || !user || !firestore || unreadCount === 0) return;

    const unreadAlerts = alerts.filter(alert => !alert.readBy?.includes(user.uid));
    const batch = writeBatch(firestore);
    unreadAlerts.forEach(alert => {
      const alertRef = doc(firestore, 'alerts', alert.id);
      batch.update(alertRef, {
        readBy: arrayUnion(user.uid)
      });
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
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

  // Dropdown view or dashboard widget view
  return (
    <>
        <DropdownMenuLabel>
            <div className="flex items-center justify-between">
                <span>Recent Notifications</span>
                {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
            </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
            {isLoading && (
                <div className="p-2 space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            )}
            {alerts && alerts.length > 0 ? (
                alerts.map(alert => (
                    <DropdownMenuItem key={alert.id} asChild className="h-auto items-start">
                        <Link href={alert.action} className="flex gap-3 py-2">
                            <div className="mt-1">{alertIcons[alert.type]}</div>
                            <div>
                                <p className="text-sm font-medium leading-snug whitespace-normal">{alert.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">{formatDateSafe(alert.createdAt)}</p>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                ))
            ) : (
                !isLoading && <p className="p-4 text-sm text-center text-muted-foreground">No new notifications.</p>
            )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
            <Link href="/notifications" className="justify-center">
                View all notifications
            </Link>
        </DropdownMenuItem>
         {unreadCount > 0 && (
             <DropdownMenuItem onClick={handleMarkAsRead} className="justify-center focus:bg-primary/10">
                Mark all as read
            </DropdownMenuItem>
         )}
    </>
  );
}
