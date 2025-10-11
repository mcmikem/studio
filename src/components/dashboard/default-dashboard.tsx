
"use client"

import type { User } from "@/lib/types"
import { DashboardGrid } from "./dashboard-grid"
import { TeamPulse } from "./team-activity-feed"
import { DailyActions } from "./daily-actions"
import { TeamToday } from "./team-today"
import { DashboardCalendar } from "./dashboard-calendar"
import { Alerts } from "./alerts"
import { ManagementQuickLinks } from "./management-quick-links"
import { DashboardHeader } from "./dashboard-header"
import { QuickStatsSummary } from "./quick-stats-summary"

export function DefaultDashboard({ profile }: { profile: User }) {

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
       <div className="col-span-full mt-6">
          <QuickStatsSummary />
      </div>

      <DashboardGrid className="lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TeamPulse />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <DailyActions />
          <DashboardCalendar />
          <TeamToday />
        </div>
      </DashboardGrid>
    </div>
  )
}
