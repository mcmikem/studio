"use client"

import type { User } from "@/lib/types"
import { DailyActions } from "./daily-actions"
import { TeamActivityFeed } from "./team-activity-feed"
import { DashboardCalendar } from "./dashboard-calendar"
import { MyPriorities } from "./my-priorities"
import { TeamToday } from "./team-today"

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
          <MyPriorities />
          <TeamToday />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 gap-6">
          <DailyActions />
          <TeamActivityFeed />
        </div>
        <div className="lg:col-span-3">
          <DashboardCalendar />
        </div>
      </div>
    </>
  )
}
