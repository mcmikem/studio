
'use client';

import { NotificationsList } from '@/components/notifications/notifications-list';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-8 w-8" />
          Notifications
        </h1>
        <p className="text-muted-foreground">
          A complete history of all your alerts and updates.
        </p>
      </header>
      <NotificationsList isPage />
    </div>
  );
}
