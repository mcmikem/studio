
'use client';

import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import dynamic from 'next/dynamic'
import type { DashboardProps, DashboardData } from "./dashboard-loader"
import { Skeleton } from '../ui/skeleton';
import { DashboardHeader } from "./dashboard-header"

const PartnershipPipeline = dynamic(() => import('@/components/dashboard/program-manager/partnership-pipeline').then(mod => mod.PartnershipPipeline), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});

const QuickInsights = dynamic(() => import('@/components/dashboard/program-manager/quick-insights').then(mod => mod.QuickInsights), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});

const MyWeeklyPlan = dynamic(() => import('@/components/dashboard/my-weekly-plan').then(mod => mod.MyWeeklyPlan), {
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

interface ProgramManagerDashboardProps extends DashboardProps {
    data: DashboardData;
}

export function ProgramManagerDashboard({ profile, data }: ProgramManagerDashboardProps) {
  const { partnerships, activities, users, checkins, checkouts, allExpenses, testimonies } = data;
  const isLoading = !partnerships || !activities || !users || !checkins;

  return (
    <div className="flex flex-col gap-8">
        <DashboardHeader profile={profile} />
        <DashboardGrid className="mt-2 lg:grid-cols-3">
            <div className="lg:col-span-1 flex flex-col gap-8">
                <PartnershipPipeline partnerships={partnerships} isLoading={isLoading} />
                <MyWeeklyPlan />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-8">
                 <TeamPerformanceLeaderboard 
                    activities={activities} 
                    users={users} 
                    checkins={checkins} 
                    checkouts={checkouts} 
                    expenses={allExpenses}
                    testimonies={testimonies}
                    isLoading={isLoading} 
                />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-8">
                <QuickInsights activities={activities} />
                <TeamDeployment users={users} checkins={checkins} isLoading={isLoading} />
            </div>
        </DashboardGrid>
    </div>
  );
}
