
'use client';

import React, { Suspense, lazy, useEffect, useState } from 'react';
import type { User as UserProfileType } from '@/lib/types';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { DefaultDashboard } from './default-dashboard';
import { DashboardSkeleton } from './dashboard-skeleton';
import { NotificationPrompt } from '@/components/notifications/notification-prompt';

export interface DashboardProps {
  profile: UserProfileType;
}

// Lazy load dashboards using React.lazy instead of next/dynamic
const AdminDashboard = lazy(() => import('./admin-dashboard').then(mod => ({ default: mod.AdminDashboard })));
const ExecutiveDashboard = lazy(() => import('./executive-dashboard').then(mod => ({ default: mod.ExecutiveDashboard })));
const ProgramManagerDashboard = lazy(() => import('./program-manager-dashboard').then(mod => ({ default: mod.ProgramManagerDashboard })));
const FieldStaffDashboard = lazy(() => import('./field-staff-dashboard').then(mod => ({ default: mod.FieldStaffDashboard })));
const MediaFinanceDashboard = lazy(() => import('./media-finance-dashboard').then(mod => ({ default: mod.MediaFinanceDashboard })));
const InternDashboard = lazy(() => import('./intern-dashboard').then(mod => ({ default: mod.InternDashboard })));
const VolunteerDashboard = lazy(() => import('./intern-volunteer-dashboard').then(mod => ({ default: mod.InternVolunteerDashboard })));

const dashboardMap: Record<string, React.LazyExoticComponent<React.ComponentType<{ profile: UserProfileType }>>> = {
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
    <div className="w-full space-y-4">
      <NotificationPrompt />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardComponent profile={profile} />
      </Suspense>
    </div>
  );
}

    