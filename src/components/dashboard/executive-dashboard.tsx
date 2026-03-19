
'use client';

import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import dynamic from 'next/dynamic'
import { QuickStatsSummary } from "./quick-stats-summary"
import { DashboardHeader } from "./dashboard-header"
import type { DashboardProps } from "./dashboard-loader"
import { Skeleton } from "../ui/skeleton";
import { RoleMissionCard } from "./role-mission-card";

import { useFirestore, useCollection } from "@/firebase"
import { collection, query, limit, orderBy } from "firebase/firestore"
import { useMemo } from "react"
import type { Checkout } from "@/lib/types"

const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), { loading: () => <Skeleton className="h-64 rounded-2xl" />, ssr: false });
const ApprovalQueue = dynamic(() => import('@/components/dashboard/approval-queue').then(mod => mod.ApprovalQueue), { loading: () => <Skeleton className="h-64 rounded-2xl" />, ssr: false });
const EcosystemPulse = dynamic(() => import('@/components/dashboard/ecosystem-pulse').then(mod => mod.EcosystemPulse), { loading: () => <Skeleton className="h-64 rounded-2xl" />, ssr: false });
const KeyResultsTracker = dynamic(() => import('@/components/plan/key-results-tracker').then(mod => mod.KeyResultsTracker), { loading: () => <Skeleton className="h-96 rounded-2xl" />, ssr: false });
const ProgramHealthScore = dynamic(() => import('@/components/dashboard/program-health-score').then(mod => mod.ProgramHealthScore), { loading: () => <Skeleton className="h-64 rounded-2xl" />, ssr: false });
const GrantDeadlineBanner = dynamic(() => import('@/components/dashboard/grant-deadline-alert').then(mod => mod.GrantDeadlineBanner), { loading: () => <Skeleton className="h-16 rounded-2xl" />, ssr: false });
const TeamPerformanceLeaderboard = dynamic(() => import('@/components/dashboard/team-performance-leaderboard').then(mod => mod.TeamPerformanceLeaderboard), { loading: () => <Skeleton className="h-96 rounded-2xl" />, ssr: false });
const AiStrategicAdvisor = dynamic(() => import('@/components/dashboard/ai-strategic-advisor').then(mod => mod.AiStrategicAdvisor), { loading: () => <Skeleton className="h-96 rounded-2xl" />, ssr: false });

export function ExecutiveDashboard({ profile }: DashboardProps) {
    return (
      <div className="flex flex-col gap-8">
          <DashboardHeader profile={profile} />
          <QuickStatsSummary />
          <GrantDeadlineBanner />
          <DashboardGrid className="lg:grid-cols-3">
              <div className="lg:col-span-1 flex flex-col gap-8">
                   <ApprovalQueue />
                   <AiStrategicAdvisor />
              </div>
              <div className="lg:col-span-1 flex flex-col gap-8">
                  <TeamDeployment />
                  <EcosystemPulse />
              </div>
              <div className="lg:col-span-1 flex flex-col gap-8">
                   <TeamPerformanceLeaderboard />
              </div>
          </DashboardGrid>
             <DashboardGrid>
                  <KeyResultsTracker />
             </DashboardGrid>
             <DashboardGrid>
                  <ProgramHealthScore />
             </DashboardGrid>
            <RoleMissionCard profile={profile} />
      </div>
    )
}
