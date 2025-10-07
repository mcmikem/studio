'use client';

import { MediaFinanceDashboard } from '@/components/dashboard/media-finance-dashboard';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Loader2 } from 'lucide-react';

export default function MediaFinancePage() {
  const { user } = useUser();
  const { profile, isLoading } = useUserProfile(user);

  if (isLoading || !profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return <MediaFinanceDashboard profile={profile} />;
}
