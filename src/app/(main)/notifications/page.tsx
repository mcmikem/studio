
'use client';

import { NotificationsList } from '@/components/notifications/notifications-list';
import { Bell } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        icon={Bell}
        title="Notifications"
        description="A complete history of all your alerts and updates."
      />
      <NotificationsList isPage />
    </div>
  );
}
