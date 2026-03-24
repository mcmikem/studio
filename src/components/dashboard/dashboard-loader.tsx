
'use client';

import React, { useEffect, useState } from 'react';
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

const AdminDashboard = dynamic(() => import('./admin-dashboard').then(mod => mod.AdminDashboard), { loading: () => <DashboardSkeleton />, ssr: false });
const ExecutiveDashboard = dynamic(() => import('./executive-dashboard').then(mod => mod.ExecutiveDashboard), { loading: () => <DashboardSkeleton />, ssr: false });
const ProgramManagerDashboard = dynamic(() => import('./program-manager-dashboard').then(mod => mod.ProgramManagerDashboard), { loading: () => <DashboardSkeleton />, ssr: false });
const FieldStaffDashboard = dynamic(() => import('./field-staff-dashboard').then(mod => mod.FieldStaffDashboard), { loading: () => <DashboardSkeleton />, ssr: false });
const MediaFinanceDashboard = dynamic(() => import('./media-finance-dashboard').then(mod => mod.MediaFinanceDashboard), { loading: () => <DashboardSkeleton />, ssr: false });
const InternDashboard = dynamic(() => import('./intern-dashboard').then(mod => mod.InternDashboard), { loading: () => <DashboardSkeleton />, ssr: false }) as React.ComponentType<{ profile: UserProfileType }>;
const VolunteerDashboard = dynamic(() => import('./intern-volunteer-dashboard').then(mod => mod.InternVolunteerDashboard), { loading: () => <DashboardSkeleton />, ssr: false }) as React.ComponentType<{ profile: UserProfileType }>;

const dashboardMap: Record<string, React.ComponentType<{ profile: UserProfileType }>> = {
  'Administrator': AdminDashboard,
  'Executive Director': ExecutiveDashboard,
  'Programs & Partnerships Manager': ProgramManagerDashboard,
  'Operations & Field Manager': FieldStaffDashboard,
  'Media & Finance Lead': MediaFinanceDashboard,
  'Media & Communications Lead': MediaFinanceDashboard,
  'Field Coordinator': FieldStaffDashboard,
  'Intern': InternDashboard,
  'Volunteer': VolunteerDashboard,
};

export function DashboardLoader() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user);
  const [renderKey, setRenderKey] = useState(0);

  // Force re-render on navigation to avoid cached component issues
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setRenderKey(k => k + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading || !user) {
    return <DashboardSkeleton />;
  }

  if (!profile) {
    return <DefaultDashboard />;
  }

  // Ensure we have a valid profile with required fields
  if (!profile.id || !profile.role) {
    return <DefaultDashboard />;
  }
  
  const DashboardComponent = dashboardMap[profile.role];
  
  if (!DashboardComponent) {
    return <DefaultDashboard />;
  }

  return (
    <div className="w-full space-y-4" key={renderKey}>
      <NotificationPrompt />
      <DashboardComponent profile={profile} />
    </div>
  );
}

    