'use client';

import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import dynamic from 'next/dynamic'
import type { DashboardProps, DashboardData } from "./dashboard-loader"
import { Skeleton } from '../ui/skeleton';

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

const DashboardCalendar = dynamic(() => import('@/components/dashboard/dashboard-calendar').then(mod => mod.DashboardCalendar), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});

const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});

interface ProgramManagerDashboardProps extends DashboardProps {
    data: DashboardData;
}

export function ProgramManagerDashboard({ profile, data }: ProgramManagerDashboardProps) {
  const { partnerships, activities, users, checkins } = data;
  const isLoading = !partnerships || !activities || !users || !checkins;

  return (
    <DashboardGrid className="mt-6 lg:grid-cols-2">
        <PartnershipPipeline partnerships={partnerships} isLoading={isLoading} />
        <QuickInsights activities={activities} />
        <TeamDeployment users={users} checkins={checkins} isLoading={isLoading} />
        <DashboardCalendar />
        <div className="lg:col-span-2">
            <MyWeeklyPlan />
        </div>
    </DashboardGrid>
  );
}
