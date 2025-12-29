
'use client';

import React from 'react';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminDashboard } from './admin-dashboard';
import { ExecutiveDashboard } from './executive-dashboard';
import { ProgramManagerDashboard } from './program-manager-dashboard';
import { FieldStaffDashboard } from './field-staff-dashboard';
import { InternVolunteerDashboard } from './intern-volunteer-dashboard';
import DefaultDashboard from './default-dashboard'; // Fixed import to use default
import { MediaFinanceDashboard } from './media-finance-dashboard';
import type { User as UserProfile } from '@/lib/types';

interface DashboardProps {
  user: any; 
  profile: UserProfile;
}

const dashboardMap: Record<string, React.ComponentType<DashboardProps>> = {
  'Administrator': AdminDashboard as any,
  'Executive Director': ExecutiveDashboard as any,
  'Programs & Partnerships Manager': ProgramManagerDashboard as any,
  'Operations & Field Manager': FieldStaffDashboard as any,
  'Media & Communications Lead': MediaFinanceDashboard as any,
  'Intern': InternVolunteerDashboard as any,
  'Volunteer': InternVolunteerDashboard as any,
};

export function DashboardLoader() {
  const { user, isUserLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user);

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="h-[400px] md:col-span-4" />
          <Skeleton className="h-[400px] md:col-span-3" />
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <DefaultDashboard />;
  }

  const DashboardComponent = dashboardMap[profile.role] || DefaultDashboard;

  return <DashboardComponent user={user} profile={profile} />;
}
