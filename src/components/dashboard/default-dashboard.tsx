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

export function DefaultDashboard({ profile }: { profile: User }) {

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />

      <DashboardGrid className="lg:grid-cols-3 mt-0">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TeamPulse />
          <DashboardCalendar />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <DailyActions />
          <TeamToday />
          <Alerts />
          <ManagementQuickLinks />
        </div>
      </DashboardGrid>
    </div>
  )
}
