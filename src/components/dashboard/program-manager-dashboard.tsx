"use client"

import type { User } from "@/lib/types"
import { ProgramsOverview } from "./programs-overview"
import { TeamActivityFeed } from "./team-activity-feed"
import { PartnershipsOverview } from "./partnerships-overview"
import { DailyActions } from "./daily-actions"
import { QuickStatsSummary } from "./quick-stats-summary"
import { TeamToday } from "./team-today"
import { Alerts } from './alerts'
import { DashboardGrid } from "./dashboard-grid"

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

export function ProgramManagerDashboard({ profile }: { profile: User }) {
  const firstName = profile?.name?.split(" ")[0] || "User"

  return (
    <>
      <header className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-primary">
          {getGreeting()}, {firstName}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {dateString} | Here's the pulse on your programs and partnerships.
        </p>
      </header>
       <DashboardGrid
        headerContent={<QuickStatsSummary />}
        mainContent={
          <>
            <ProgramsOverview />
            <TeamActivityFeed />
            <PartnershipsOverview />
          </>
        }
        sidebarContent={
          <>
            <DailyActions />
            <TeamToday />
            <Alerts />
          </>
        }
      />
    </>
  )
}
