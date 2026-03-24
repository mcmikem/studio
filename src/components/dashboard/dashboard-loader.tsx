
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { User as UserProfileType } from '@/lib/types';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { DefaultDashboard } from './default-dashboard';
import { DashboardSkeleton } from './dashboard-skeleton';
import { NotificationPrompt } from '@/components/notifications/notification-prompt';

export interface DashboardProps {
  profile: UserProfileType;
}

// Use dynamic imports - simplified without custom loading states
const DynamicAdminDashboard = dynamic(() => import('./admin-dashboard').then(mod => mod.AdminDashboard), { ssr: false });
const DynamicExecutiveDashboard = dynamic(() => import('./executive-dashboard').then(mod => mod.ExecutiveDashboard), { ssr: false });
const DynamicProgramManagerDashboard = dynamic(() => import('./program-manager-dashboard').then(mod => mod.ProgramManagerDashboard), { ssr: false });
const DynamicFieldStaffDashboard = dynamic(() => import('./field-staff-dashboard').then(mod => mod.FieldStaffDashboard), { ssr: false });
const DynamicMediaFinanceDashboard = dynamic(() => import('./media-finance-dashboard').then(mod => mod.MediaFinanceDashboard), { ssr: false });
const DynamicInternDashboard = dynamic(() => import('./intern-dashboard').then(mod => mod.InternDashboard), { ssr: false });
const DynamicVolunteerDashboard = dynamic(() => import('./intern-volunteer-dashboard').then(mod => mod.InternVolunteerDashboard), { ssr: false });

function DashboardRenderer({ profile }: { profile: UserProfileType }) {
  const Component = React.useMemo(() => {
    switch (profile.role) {
      case 'Administrator':
        return DynamicAdminDashboard;
      case 'Executive Director':
        return DynamicExecutiveDashboard;
      case 'Programs & Partnerships Manager':
        return DynamicProgramManagerDashboard;
      case 'Operations & Field Manager':
      case 'Field Coordinator':
        return DynamicFieldStaffDashboard;
      case 'Media & Finance Lead':
      case 'Media & Communications Lead':
        return DynamicMediaFinanceDashboard;
      case 'Intern':
        return DynamicInternDashboard;
      case 'Volunteer':
        return DynamicVolunteerDashboard;
      default:
        return null;
    }
  }, [profile?.role]);

  if (!Component) {
    return <DefaultDashboard />;
  }

  return <Component profile={profile} />;
}

export function DashboardLoader() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user);

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <DefaultDashboard />;
  }

  if (!profile) {
    return <DefaultDashboard />;
  }

  return (
    <div className="w-full space-y-4">
      <NotificationPrompt />
      <DashboardRenderer profile={profile} />
    </div>
  );
}

    