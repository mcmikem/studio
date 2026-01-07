
'use client';

import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';

export default function App() {
  const { user, isUserLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user);

  const isLoading = isUserLoading || (user && isProfileLoading);

  // This is the critical change: We will show a loader until *all* initial auth
  // and profile checks are complete. We will not attempt to render any dashboard
  // component (default or user-specific) until isLoading is false.
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Once all loading is complete, we can safely render the DashboardLoader.
  // The DashboardLoader will internally decide whether to show the
  // user-specific dashboard (if a profile exists) or the DefaultDashboard (if profile is null).
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
        <DashboardLoader profile={profile} />
    </Suspense>
  );
}
