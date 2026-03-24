
'use client';

import React, { useMemo } from 'react';
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

// Use dynamic imports with proper loading fallbacks
const DynamicAdminDashboard = dynamic(() => import('./admin-dashboard').then(mod => ({ default: mod.AdminDashboard })), { loading: () => <DashboardSkeleton />, ssr: false });
const DynamicExecutiveDashboard = dynamic(() => import('./executive-dashboard').then(mod => ({ default: mod.ExecutiveDashboard })), { loading: () => <DashboardSkeleton />, ssr: false });
const DynamicProgramManagerDashboard = dynamic(() => import('./program-manager-dashboard').then(mod => ({ default: mod.ProgramManagerDashboard })), { loading: () => <DashboardSkeleton />, ssr: false });
const DynamicFieldStaffDashboard = dynamic(() => import('./field-staff-dashboard').then(mod => ({ default: mod.FieldStaffDashboard })), { loading: () => <DashboardSkeleton />, ssr: false });
const DynamicMediaFinanceDashboard = dynamic(() => import('./media-finance-dashboard').then(mod => ({ default: mod.MediaFinanceDashboard })), { loading: () => <DashboardSkeleton />, ssr: false });
const DynamicInternDashboard = dynamic(() => import('./intern-dashboard').then(mod => ({ default: mod.InternDashboard })), { loading: () => <DashboardSkeleton />, ssr: false });
const DynamicVolunteerDashboard = dynamic(() => import('./intern-volunteer-dashboard').then(mod => ({ default: mod.InternVolunteerDashboard })), { loading: () => <DashboardSkeleton />, ssr: false });

function getDashboardForRole(role: string | undefined): React.ComponentType<{ profile: UserProfileType }> | null {
  if (!role) return null;
  
  switch (role) {
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
}

export function DashboardLoader() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user);

  const isLoading = isAuthLoading || isProfileLoading;

  // Show skeleton while loading
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Show default dashboard if no user
  if (!user) {
    return <DefaultDashboard />;
  }

  // Show default dashboard if no profile
  if (!profile) {
    return <DefaultDashboard />;
  }

  // Ensure we have a valid profile with required fields
  if (!profile.id || !profile.role) {
    return <DefaultDashboard />;
  }
  
  const DashboardComponent = getDashboardForRole(profile.role);
  
  // Fallback to default if no matching dashboard
  if (!DashboardComponent) {
    return <DefaultDashboard />;
  }

  return (
    <div className="w-full space-y-4">
      <NotificationPrompt />
      <DashboardComponent profile={profile} />
    </div>
  );
}

    