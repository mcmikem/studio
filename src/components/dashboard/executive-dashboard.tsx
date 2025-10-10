
"use client"

import type { User } from "@/lib/types"
import { Alerts } from "./alerts"
import { QuickStatsSummary } from "./quick-stats-summary"
import { ProgramsOverview } from "./programs-overview"
import { TeamToday } from "./team-today"
import { ManagementQuickLinks } from "./management-quick-links"
import { DashboardGrid } from "./dashboard-grid"
import { TeamPulse } from "./team-activity-feed"

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

const today = new Date()
const dateString = today.toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
})

export function ExecutiveDashboard({ profile }: { profile: User }) {
  const firstName = profile?.name?.split(" ")[0] || "User"

  return (
    <>
      <header className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-primary">
          {getGreeting()}, {firstName}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {dateString} | Here is the organization's high-level overview.
        </p>
      </header>
       <DashboardGrid className="lg:grid-cols-3">
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
    </>
  )
}
