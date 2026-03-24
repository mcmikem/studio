'use client';

import React from 'react';
import type { User as UserProfileType } from '@/lib/types';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { DefaultDashboard } from './default-dashboard';
import { DashboardSkeleton } from './dashboard-skeleton';
import { NotificationPrompt } from '@/components/notifications/notification-prompt';
import { DashboardHeader } from './dashboard-header';
import { RoleMissionCard } from './role-mission-card';

export interface DashboardProps {
  profile: UserProfileType;
}

// ============= EXECUTIVE DASHBOARD =============
function ExecutiveDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      <div className="text-center p-8 text-muted-foreground">
        <p>Executive Dashboard - Full features coming soon</p>
      </div>
      <RoleMissionCard profile={profile} />
    </div>
  );
}

// ============= ADMIN DASHBOARD =============
function AdminDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      <div className="text-center p-8 text-muted-foreground">
        <p>Admin Dashboard - Full features coming soon</p>
      </div>
      <RoleMissionCard profile={profile} />
    </div>
  );
}

// ============= FIELD STAFF DASHBOARD =============
function FieldStaffDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      <div className="text-center p-8 text-muted-foreground">
        <p>Field Staff Dashboard - Full features coming soon</p>
      </div>
      <RoleMissionCard profile={profile} />
    </div>
  );
}

// ============= PROGRAM MANAGER DASHBOARD =============
function ProgramManagerDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      <div className="text-center p-8 text-muted-foreground">
        <p>Program Manager Dashboard - Full features coming soon</p>
      </div>
      <RoleMissionCard profile={profile} />
    </div>
  );
}

// ============= MEDIA & FINANCE DASHBOARD =============
function MediaFinanceDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      <div className="text-center p-8 text-muted-foreground">
        <p>Media & Finance Dashboard - Full features coming soon</p>
      </div>
      <RoleMissionCard profile={profile} />
    </div>
  );
}

// ============= INTERN DASHBOARD =============
function InternDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      <div className="text-center p-8 text-muted-foreground">
        <p>Intern Dashboard - Full features coming soon</p>
      </div>
      <RoleMissionCard profile={profile} />
    </div>
  );
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
    <div className="w-full space-y-4">
      <NotificationPrompt />
      <DashboardComponent profile={profile} />
    </div>
  );
}