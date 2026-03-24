
'use client';

import { DashboardHeader } from "./dashboard-header"
import { RoleMissionCard } from "./role-mission-card"
import { DashboardSection } from "./dashboard-section"
import { AttentionNeeded } from "./attention-needed"
import { QuickStatsSummary } from "./quick-stats-summary"
import { TeamDeployment } from "./team-deployment"
import { TeamPerformanceLeaderboard } from "./team-performance-leaderboard"
import { EcosystemPulse } from "./ecosystem-pulse"
import { ProgramHealthScore } from "./program-health-score"
import { ApprovalQueue } from "./approval-queue"
import { AiStrategicAdvisor } from "./ai-strategic-advisor"
import type { DashboardProps } from "./dashboard-loader"
import { Users, BarChart3, Wallet, Sparkles } from 'lucide-react'

import dynamic from 'next/dynamic'
const KeyResultsTracker = dynamic(() => import('@/components/plan/key-results-tracker').then(mod => mod.KeyResultsTracker), {
  loading: () => <div className="h-48 bg-muted animate-pulse rounded-xl" />,
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
        lazy={true}
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
        lazy={true}
      >
        <ApprovalQueue />
      </DashboardSection>
      <DashboardSection
        title="Strategy & Grants"
        description="AI advisor and key results tracking"
        icon={Sparkles}
        defaultOpen={false}
        lazy={true}
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
