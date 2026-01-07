
'use client';

import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import { DefaultDashboard } from '@/components/dashboard/default-dashboard';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';

export default function App() {
  const { user, isUserLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user);

  const isLoading = isUserLoading || (user && isProfileLoading);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If there's no user or no profile after loading, show the public/default dashboard.
  if (!user || !profile) {
    return (
        <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <DefaultDashboard />
        </Suspense>
    );
  }

  // Once we have a profile, render the specific dashboard for that user.
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
        <DashboardLoader profile={profile} />
    </Suspense>
  );
}
