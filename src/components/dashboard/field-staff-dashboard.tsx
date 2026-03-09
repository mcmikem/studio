
'use client';

import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import dynamic from 'next/dynamic'
import type { DashboardProps } from './dashboard-loader';
import { Skeleton } from '../ui/skeleton';
import { DashboardHeader } from "./dashboard-header"
import { RoleMissionCard } from "./role-mission-card"

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
const TeamPerformanceLeaderboard = dynamic(() => import('@/components/dashboard/team-performance-leaderboard').then(mod => mod.TeamPerformanceLeaderboard), {
    loading: () => <Skeleton className="h-64" />,
    ssr: false,
});

export function FieldStaffDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-8">
        <DashboardHeader profile={profile} />
        <DashboardGrid className="mt-2 lg:grid-cols-3">
             <div className="lg:col-span-1 flex flex-col gap-8">
                <MyWeeklyPlan />
                <DashboardCalendar />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-8">
                <TeamDeployment />
            </div>
             <div className="lg:col-span-1 flex flex-col gap-8">
                <TeamPerformanceLeaderboard />
            </div>
        </DashboardGrid>
        <RoleMissionCard profile={profile} />
    </div>
  );
}
