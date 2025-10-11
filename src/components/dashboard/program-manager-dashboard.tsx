"use client"

import type { User } from "@/lib/types"
import { ProgramsOverview } from "./programs-overview"
import { DailyActions } from "./daily-actions"
import { TeamToday } from "./team-today"
import { Alerts } from "./alerts"
import { DashboardGrid } from "./dashboard-grid"
import { ManagementQuickLinks } from "./management-quick-links"
import { DashboardHeader } from "./dashboard-header"

export function ProgramManagerDashboard({ profile }: { profile: User }) {
  
  return (
     <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
       <DashboardGrid className="lg:grid-cols-3 mt-0">
        <div className="lg:col-span-2 flex flex-col gap-6">
            <ProgramsOverview />
            <Alerts />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
            <DailyActions />
            <TeamToday />
            <ManagementQuickLinks />
        </div>
      </DashboardGrid>
    </div>
  )
}
