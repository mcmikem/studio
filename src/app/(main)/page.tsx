
'use client';

import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Loader2 } from 'lucide-react';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import { Suspense } from 'react';

function DashboardPageContent() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user);

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user && !isLoading) {
      // Allow DashboardLoader to handle the "no user" / default state if intended,
      // or redirect to login. For now, we render it as it likely handles the default view.
       return (
        <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <DashboardLoader />
        </Suspense>
      );
  }

  if (user && !profile) {
     return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4">Finalizing account setup...</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
        <DashboardLoader />
    </Suspense>
  );
}


export default function DashboardPage() {
    return <DashboardPageContent />;
}
