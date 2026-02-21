'use client';

import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import dynamic from 'next/dynamic'
import type { DashboardProps, DashboardData } from './dashboard-loader';
import { Skeleton } from '../ui/skeleton';
import { DashboardHeader } from "./dashboard-header"

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

interface FieldStaffDashboardProps extends DashboardProps {
    data: DashboardData;
}

export function FieldStaffDashboard({ profile, data }: FieldStaffDashboardProps) {
  const { checkouts, users, checkins, activities, testimonies, allExpenses } = data;
  const isLoading = !checkouts || !users || !checkins;

  return (
    <div className="flex flex-col gap-6">
        <DashboardHeader profile={profile} />
        <DashboardGrid className="mt-6 lg:grid-cols-2">
            <TeamPerformanceLeaderboard 
                activities={activities} 
                users={users} 
                checkins={checkins} 
                checkouts={checkouts} 
                expenses={allExpenses}
                testimonies={testimonies}
                isLoading={isLoading} 
            />
            <MyWeeklyPlan />
            <DashboardCalendar />
            <TeamDeployment users={users} checkins={checkins} isLoading={isLoading} />
        </DashboardGrid>
    </div>
  );
}
