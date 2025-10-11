
"use client"

import type { User } from "@/lib/types"
import { Alerts } from "./alerts"
import { QuickStatsSummary } from "./quick-stats-summary"
import { ProgramsOverview } from "./programs-overview"
import { TeamToday } from "./team-today"
import { ManagementQuickLinks } from "./management-quick-links"
import { DashboardGrid } from "./dashboard-grid"
import { TeamPulse } from "./team-activity-feed"
import { DashboardHeader } from "./dashboard-header"

export function ExecutiveDashboard({ profile }: { profile: User }) {

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />

       <DashboardGrid className="lg:grid-cols-3 mt-0">
        <div className="col-span-full">
            <QuickStatsSummary />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
            <ProgramsOverview />
            <TeamPulse />
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
