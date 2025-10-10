
"use client"

import type { User } from "@/lib/types"
import { DailyActions } from "./daily-actions"
import { TeamPulse } from "./team-activity-feed"
import { MyPriorities } from "./my-priorities"
import { TeamToday } from "./team-today"
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

export function FieldStaffDashboard({ profile }: { profile: User }) {
  const firstName = profile?.name?.split(" ")[0] || "User"

  return (
    <>
      <header className="space-y-1">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-primary">
          {getGreeting()},{" "}
          {firstName} 🚀 | Field Operations View
        </h1>
        <p className="text-sm text-muted-foreground">
          {dateString} | Mpigi District, Uganda (EAT)
        </p>
      </header>
      <DashboardGrid className="lg:grid-cols-3">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <DailyActions />
          <MyPriorities />
          <TeamToday />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TeamPulse />
        </div>
      </DashboardGrid>
    </>
  )
}
