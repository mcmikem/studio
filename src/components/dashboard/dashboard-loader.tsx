'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { User as UserProfileType } from '@/lib/types';
import { DefaultDashboard } from './default-dashboard';

// Define the shape of the dashboard props
export interface DashboardProps {
  profile: UserProfileType;
}

const DashboardSkeleton = dynamic(() => import('./dashboard-skeleton').then(mod => mod.DashboardSkeleton));
const AdminDashboard = dynamic(() => import('./admin-dashboard').then(mod => mod.AdminDashboard), { loading: () => <DashboardSkeleton />, ssr: false });
const ExecutiveDashboard = dynamic(() => import('./executive-dashboard').then(mod => mod.ExecutiveDashboard), { loading: () => <DashboardSkeleton />, ssr: false });
const ProgramManagerDashboard = dynamic(() => import('./program-manager-dashboard').then(mod => mod.ProgramManagerDashboard), { loading: () => <DashboardSkeleton />, ssr: false });
const FieldStaffDashboard = dynamic(() => import('./field-staff-dashboard').then(mod => mod.FieldStaffDashboard), { loading: () => <DashboardSkeleton />, ssr: false });
const InternVolunteerDashboard = dynamic(() => import('./intern-volunteer-dashboard').then(mod => mod.InternVolunteerDashboard), { loading: () => <DashboardSkeleton />, ssr: false });
const MediaFinanceDashboard = dynamic(() => import('./media-finance-dashboard').then(mod => mod.MediaFinanceDashboard), { loading: () => <DashboardSkeleton />, ssr: false });

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

export function DashboardLoader({ profile }: { profile: UserProfileType | null }) {
  if (!profile) {
    return <DefaultDashboard />;
  }
  
  const DashboardComponent = dashboardMap[profile.role] || DefaultDashboard;

  return <DashboardComponent profile={profile} />;
}
