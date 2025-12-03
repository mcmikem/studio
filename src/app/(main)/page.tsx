
'use client';

import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { QuickAddTask } from '@/components/dashboard/quick-add-task';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import { AppHeader } from '@/components/header';

export default function DashboardPage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user);

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!profile) {
     return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4">Finalizing account setup...</p>
      </div>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="flex flex-col gap-6 p-4 lg:p-6">
          <DashboardHeader profile={profile} />
          <QuickAddTask />
          <DashboardLoader profile={profile} />
      </div>
    </>
  );
}
