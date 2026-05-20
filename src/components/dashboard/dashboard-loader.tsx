'use client';

import React from 'react';
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
import { VolunteerDashboard } from './volunteer-dashboard';
import { BoardMemberDashboard } from './board-member-dashboard';

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
  } else if (role === 'Operations & Field Manager' || role === 'Field Coordinator' || role === 'Field Staff' || role === 'Essentials Manager' || role === 'Youth Center Manager') {
    DashboardComponent = FieldStaffDashboard;
  } else if (role === 'Media & Finance Lead' || role === 'Media & Communications Lead' || role === 'Accountant/Finance') {
    DashboardComponent = MediaFinanceDashboard;
  } else if (role === 'Resource Mobilization Lead') {
    DashboardComponent = ProgramManagerDashboard;
  } else if (role === 'Intern') {
    DashboardComponent = InternDashboard;
  } else if (role === 'Volunteer') {
    DashboardComponent = VolunteerDashboard;
  } else if (role === 'Board Chair' || role === 'Board Member') {
    DashboardComponent = BoardMemberDashboard;
  }

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