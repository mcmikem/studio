"use client"

import type { User } from "@/lib/types"
import { DashboardGrid } from "./dashboard-grid"
import { TeamPulse } from "./team-activity-feed"
import { DailyActions } from "./daily-actions"
import { TeamToday } from "./team-today"
import { DashboardCalendar } from "./dashboard-calendar"
import { Alerts } from "./alerts"
import { ManagementQuickLinks } from "./management-quick-links"

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

      <DashboardGrid className="lg:grid-cols-3">
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
    </>
  )
}
