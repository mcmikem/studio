"use client"

import type { User } from "@/lib/types"
import { DashboardGrid } from "./dashboard-grid"
import { ProgramsOverview } from "./programs-overview"
import { TeamActivityFeed } from "./team-activity-feed"
import { DailyActions } from "./daily-actions"
import { TeamToday } from "./team-today"
import { DashboardCalendar } from "./dashboard-calendar"
import { Alerts } from "./alerts"
import { PartnershipsOverview } from "./partnerships-overview"

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

export function DefaultDashboard({ profile }: { profile: User }) {
  const firstName = profile?.name?.split(" ")[0] || "User"

  return (
    <>
      <header className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-primary">
          {getGreeting()}, {firstName}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {dateString} | Welcome to your Mission Control.
        </p>
      </header>

      <DashboardGrid
        mainContent={
          <>
            <ProgramsOverview />
            <TeamActivityFeed />
            <DashboardCalendar />
          </>
        }
        sidebarContent={
          <>
            <DailyActions />
            <TeamToday />
            <Alerts />
            <PartnershipsOverview />
          </>
        }
      />
    </>
  )
}
