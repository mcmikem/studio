"use client"

import type { User } from "@/lib/types"
import { TeamActivityFeed } from "./team-activity-feed"
import { Alerts } from "./alerts"
import { QuickStatsSummary } from "./quick-stats-summary"
import { ProgramsOverview } from "./programs-overview"
import { DailyActions } from "./daily-actions"
import { TeamToday } from "./team-today"
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
      <div className="grid grid-cols-1 gap-6">
        <QuickStatsSummary />
        <ProgramsOverview />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TeamActivityFeed />
          </div>
          <div className="lg:col-span-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
            <DailyActions />
            <TeamToday />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <PartnershipsOverview />
            </div>
            <div className="lg:col-span-1">
                <Alerts />
            </div>
        </div>
      </div>
    </>
  )
}
