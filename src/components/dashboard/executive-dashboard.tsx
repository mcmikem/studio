
"use client"

import type { User, Program, Checkout } from "@/lib/types"
import { Alerts } from "./alerts"
import { QuickStatsSummary } from "./quick-stats-summary"
import { ProgramsOverview } from "./programs-overview"
import { TeamToday } from "./team-today"
import { ManagementQuickLinks } from "./management-quick-links"
import { DashboardGrid } from "./dashboard-grid"
import { TeamPulse } from "./team-activity-feed"
import { DashboardHeader } from "./dashboard-header"

interface DashboardProps {
  profile: User;
  programs: Program[] | null;
  checkouts: Checkout[] | null;
  metrics: any; // Add correct type
}


export function ExecutiveDashboard({ profile, programs, checkouts, metrics }: DashboardProps) {

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />

       <DashboardGrid className="lg:grid-cols-3 mt-0">
        <div className="col-span-full">
            <QuickStatsSummary metrics={metrics} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
            <ProgramsOverview programs={programs} />
            <TeamPulse checkouts={checkouts} />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
            <TeamToday />
            <Alerts />
            <ManagementQuickLinks />
        </div>
      </DashboardGrid>
    </div>
  )
}
