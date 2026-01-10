'use client';

import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import dynamic from 'next/dynamic'
import type { DashboardProps, DashboardData } from './dashboard-loader';
import { Skeleton } from '../ui/skeleton';

const TeamPulse = dynamic(() => import('@/components/dashboard/team-activity-feed').then(mod => mod.TeamPulse), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});
const MyWeeklyPlan = dynamic(() => import('@/components/dashboard/my-weekly-plan').then(mod => mod.MyWeeklyPlan), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});
const DashboardCalendar = dynamic(() => import('@/components/dashboard/dashboard-calendar').then(mod => mod.DashboardCalendar), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});
const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});

interface FieldStaffDashboardProps extends DashboardProps {
    data: DashboardData;
}

export function FieldStaffDashboard({ profile, data }: FieldStaffDashboardProps) {
  const { checkouts, users, checkins } = data;
  const isLoading = !checkouts || !users || !checkins;

  return (
    <DashboardGrid className="mt-6 lg:grid-cols-2">
        <MyWeeklyPlan />
        <DashboardCalendar />
        <TeamDeployment users={users} checkins={checkins} isLoading={isLoading} />
        <TeamPulse checkouts={checkouts} />
    </DashboardGrid>
  );
}
