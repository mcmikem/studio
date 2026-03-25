'use client';

import React, { useState } from 'react';
import type { User as UserProfileType } from '@/lib/types';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { DefaultDashboard } from './default-dashboard';
import { DashboardSkeleton } from './dashboard-skeleton';
import { NotificationPrompt } from '@/components/notifications/notification-prompt';
import { ExecutiveDashboard } from './executive-dashboard';
import { AdminDashboard } from './admin-dashboard';
import { FieldStaffDashboard } from './field-staff-dashboard';
import { ProgramManagerDashboard } from './program-manager-dashboard';
import { MediaFinanceDashboard } from './media-finance-dashboard';
import { InternDashboard } from './intern-dashboard';
import { ErrorBoundary } from '@/components/error-boundary';

export interface DashboardProps {
  profile: UserProfileType;
}

// ============= MAIN LOADER =============
export function DashboardLoader() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user);

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user || !profile) {
    return <DefaultDashboard />;
  }

  const role = profile.role;

  let DashboardComponent: React.ComponentType<{ profile: UserProfileType }> | null = null;

  if (role === 'Administrator') {
    DashboardComponent = AdminDashboard;
  } else if (role === 'Executive Director') {
    DashboardComponent = ExecutiveDashboard;
  } else if (role === 'Programs & Partnerships Manager') {
    DashboardComponent = ProgramManagerDashboard;
  } else if (role === 'Operations & Field Manager' || role === 'Field Coordinator') {
    DashboardComponent = FieldStaffDashboard;
  } else if (role === 'Media & Finance Lead' || role === 'Media & Communications Lead') {
    DashboardComponent = MediaFinanceDashboard;
  } else if (role === 'Intern') {
    DashboardComponent = InternDashboard;
  }

  if (!DashboardComponent) {
    return <DefaultDashboard />;
  }

  return (
    <ErrorBoundary>
      <div className="w-full space-y-4">
        <NotificationPrompt />
        <DashboardComponent profile={profile} />
      </div>
    </ErrorBoundary>
  );
}