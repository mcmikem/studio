
'use client';

import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { QuickAddTask } from '@/components/dashboard/quick-add-task';
import { DashboardLoading } from '@/components/dashboard/dashboard-loader';
import dynamic from 'next/dynamic';

// Dynamically import the DashboardLoader to keep the initial page chunk small.
const DashboardLoader = dynamic(() => 
  import('@/components/dashboard/dashboard-loader').then(mod => mod.DashboardLoader),
  { 
    loading: () => <DashboardLoading />,
    ssr: false // Ensure it's only loaded on the client side
  }
);

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
    <div className="flex flex-col gap-6">
        <DashboardHeader profile={profile} />
        <QuickAddTask />
        <DashboardLoader profile={profile} />
    </div>
  );
}
