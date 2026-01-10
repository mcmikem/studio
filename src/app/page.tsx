'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { DefaultDashboard } from '@/components/dashboard/default-dashboard';

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      {profile ? <DashboardLoader profile={profile} /> : <DefaultDashboard />}
    </Suspense>
  );
}
