
'use client';

import { DashboardHeader } from "./dashboard-header"
import { RoleMissionCard } from "./role-mission-card"
import { DashboardSection } from "./dashboard-section"
import { AttentionNeeded } from "./attention-needed"
import { QuickStatsSummary } from "./quick-stats-summary"
import dynamic from 'next/dynamic'
import { Skeleton } from "../ui/skeleton"
import type { DashboardProps } from "./dashboard-loader"
import { Users, BarChart3, Wallet, Sparkles } from 'lucide-react'

const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});
const TeamPerformanceLeaderboard = dynamic(() => import('@/components/dashboard/team-performance-leaderboard').then(mod => mod.TeamPerformanceLeaderboard), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});
const EcosystemPulse = dynamic(() => import('@/components/dashboard/ecosystem-pulse').then(mod => mod.EcosystemPulse), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});
const ProgramHealthScore = dynamic(() => import('@/components/dashboard/program-health-score').then(mod => mod.ProgramHealthScore), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});
const KeyResultsTracker = dynamic(() => import('@/components/plan/key-results-tracker').then(mod => mod.KeyResultsTracker), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});
const AiStrategicAdvisor = dynamic(() => import('@/components/dashboard/ai-strategic-advisor').then(mod => mod.AiStrategicAdvisor), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});
const ApprovalQueue = dynamic(() => import('@/components/dashboard/approval-queue').then(mod => mod.ApprovalQueue), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});

export function ExecutiveDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      <AttentionNeeded />
      <QuickStatsSummary />
      <DashboardSection
        title="Team & Performance"
        description="Deployment, activity, and rankings"
        icon={Users}
        defaultOpen={true}
        badgeColor="green"
      >
        <DashboardSectionInner />
      </DashboardSection>
      <DashboardSection
        title="Programmes & Impact"
        description="Health scores, ecosystem pulse, and KPIs"
        icon={BarChart3}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProgramHealthScore />
          <EcosystemPulse />
        </div>
      </DashboardSection>
      <DashboardSection
        title="Finance & Approvals"
        description="Expense queue and budget tracking"
        icon={Wallet}
        defaultOpen={false}
      >
        <ApprovalQueue />
      </DashboardSection>
      <DashboardSection
        title="Strategy & Grants"
        description="AI advisor and key results tracking"
        icon={Sparkles}
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AiStrategicAdvisor />
          <KeyResultsTracker />
        </div>
      </DashboardSection>
      <RoleMissionCard profile={profile} />
    </div>
  )
}

function DashboardSectionInner() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TeamDeployment />
      <TeamPerformanceLeaderboard />
    </div>
  )
}
