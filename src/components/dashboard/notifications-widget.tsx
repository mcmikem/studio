'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, AlertCircle, Info, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  read?: boolean;
  createdAt?: { toDate?: () => Date };
}

interface NotificationsWidgetProps {
  compact?: boolean;
}

export function NotificationsWidget({ compact = false }: NotificationsWidgetProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const notificationsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(compact ? 3 : 5)
    );
  }, [firestore, user, compact]);

  const { data: notifications, isLoading } = useCollection(notificationsQuery);

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const getIcon = (type?: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold">Notifications</span>
          </div>
          {unreadCount > 0 && (
            <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        {!notifications || notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No notifications
          </p>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, compact ? 3 : 5).map((notification: any) => (
              <div 
                key={notification.id} 
                className={cn(
                  "flex items-start gap-2 p-2 rounded",
                  notification.read ? 'bg-muted/30' : 'bg-blue-50 border border-blue-100'
                )}
              >
                {getIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{notification.title || 'Notification'}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {notification.message}
                  </p>
                  {notification.createdAt?.toDate && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" size="sm" asChild className="w-full mt-3">
          <Link href="/notifications">View All</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
