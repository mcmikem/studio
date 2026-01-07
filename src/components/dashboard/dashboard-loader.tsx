
'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import type { User as UserProfileType } from '@/lib/types';
import { DefaultDashboard } from './default-dashboard';

// Define the shape of the dashboard props
export interface DashboardProps {
  profile: UserProfileType;
}

// Dynamically import all dashboard components
const AdminDashboard = dynamic(() => import('./admin-dashboard').then(mod => mod.AdminDashboard), { loading: () => <DashboardSkeleton /> });
const ExecutiveDashboard = dynamic(() => import('./executive-dashboard').then(mod => mod.ExecutiveDashboard), { loading: () => <DashboardSkeleton /> });
const ProgramManagerDashboard = dynamic(() => import('./program-manager-dashboard').then(mod => mod.ProgramManagerDashboard), { loading: () => <DashboardSkeleton /> });
const FieldStaffDashboard = dynamic(() => import('./field-staff-dashboard').then(mod => mod.FieldStaffDashboard), { loading: () => <DashboardSkeleton /> });
const InternVolunteerDashboard = dynamic(() => import('./intern-volunteer-dashboard').then(mod => mod.InternVolunteerDashboard), { loading: () => <DashboardSkeleton /> });
const MediaFinanceDashboard = dynamic(() => import('./media-finance-dashboard').then(mod => mod.MediaFinanceDashboard), { loading: () => <DashboardSkeleton /> });

const dashboardMap: Record<string, React.ComponentType<DashboardProps>> = {
  'Administrator': AdminDashboard,
  'Executive Director': ExecutiveDashboard,
  'Programs & Partnerships Manager': ProgramManagerDashboard,
  'Operations & Field Manager': FieldStaffDashboard,
  'Media & Communications Lead': MediaFinanceDashboard,
  'Media & Finance Lead': MediaFinanceDashboard,
  'Field Coordinator': FieldStaffDashboard,
  'Intern': InternVolunteerDashboard,
  'Volunteer': InternVolunteerDashboard,
};

const DashboardSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-32" />
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
)

export function DashboardLoader({ profile }: { profile: UserProfileType | null }) {
  // If there's no profile after the initial load, show the public/default dashboard.
  if (!profile) {
    return <DefaultDashboard />;
  }

  // Otherwise, select the correct dashboard based on the user's role.
  const DashboardComponent = dashboardMap[profile.role] || DefaultDashboard;

  return <DashboardComponent profile={profile} />;
}
