'use client';

import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import dynamic from 'next/dynamic'
import { QuickStatsSummary } from "./quick-stats-summary"
import { DashboardHeader } from "./dashboard-header"
import type { DashboardProps, DashboardData } from "./dashboard-loader"
import { Skeleton } from "../ui/skeleton";

const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), { loading: () => <Skeleton className="h-64" />, ssr: false });
const ApprovalQueue = dynamic(() => import('@/components/dashboard/approval-queue').then(mod => mod.ApprovalQueue), { loading: () => <Skeleton className="h-64" />, ssr: false });
const EcosystemPulse = dynamic(() => import('@/components/dashboard/ecosystem-pulse').then(mod => mod.EcosystemPulse), { loading: () => <Skeleton className="h-64" />, ssr: false });
const KeyResultsTracker = dynamic(() => import('@/components/plan/key-results-tracker').then(mod => mod.KeyResultsTracker), { loading: () => <Skeleton className="h-64" />, ssr: false });
const TeamPerformanceLeaderboard = dynamic(() => import('@/components/dashboard/team-performance-leaderboard').then(mod => mod.TeamPerformanceLeaderboard), { loading: () => <Skeleton className="h-64" />, ssr: false });

interface ExecutiveDashboardProps extends DashboardProps {
    data: DashboardData;
}

export function ExecutiveDashboard({ profile, data }: ExecutiveDashboardProps) {
    const { activities, users, checkins, programs, metrics, checkouts } = data;
    const isLoading = !activities || !users || !checkins || !programs || !metrics || !checkouts;

    return (
      <div className="flex flex-col gap-6">
          <DashboardHeader profile={profile} />
          <QuickStatsSummary metrics={metrics} />
        
          <KeyResultsTracker />
        
          <DashboardGrid className="lg:grid-cols-3">
              <div className="flex flex-col gap-6">
                  <ApprovalQueue />
                  <TeamDeployment users={users} checkins={checkins} isLoading={isLoading} />
              </div>
              <div className="flex flex-col gap-6">
                  <EcosystemPulse activities={activities} programs={programs} isLoading={isLoading} />
                  <TeamPerformanceLeaderboard 
                      users={users} 
                      isLoading={isLoading}
                  />
              </div>
                <div className="flex flex-col gap-6">
                  
              </div>
          </DashboardGrid>
      </div>
    )
}
