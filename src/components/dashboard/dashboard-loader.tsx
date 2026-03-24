'use client';

import React, { Suspense } from 'react';
import type { User as UserProfileType } from '@/lib/types';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { DefaultDashboard } from './default-dashboard';
import { DashboardSkeleton } from './dashboard-skeleton';
import { NotificationPrompt } from '@/components/notifications/notification-prompt';

export interface DashboardProps {
  profile: UserProfileType;
}

function ExecutiveDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-xl font-bold">Welcome, {profile?.name || 'User'}</div>
      <div className="p-4 bg-muted rounded-lg">
        <p>Executive Dashboard Loading...</p>
      </div>
    </div>
  );
}

function AdminDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-xl font-bold">Welcome, {profile?.name || 'User'}</div>
      <div className="p-4 bg-muted rounded-lg">
        <p>Admin Dashboard</p>
      </div>
    </div>
  );
}

function FieldStaffDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-xl font-bold">Welcome, {profile?.name || 'User'}</div>
      <div className="p-4 bg-muted rounded-lg">
        <p>Field Staff Dashboard</p>
      </div>
    </div>
  );
}

function ProgramManagerDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-xl font-bold">Welcome, {profile?.name || 'User'}</div>
      <div className="p-4 bg-muted rounded-lg">
        <p>Program Manager Dashboard</p>
      </div>
    </div>
  );
}

function MediaFinanceDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-xl font-bold">Welcome, {profile?.name || 'User'}</div>
      <div className="p-4 bg-muted rounded-lg">
        <p>Media & Finance Dashboard</p>
      </div>
    </div>
  );
}

function InternDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-xl font-bold">Welcome, {profile?.name || 'User'}</div>
      <div className="p-4 bg-muted rounded-lg">
        <p>Intern Dashboard</p>
      </div>
    </div>
  );
}

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