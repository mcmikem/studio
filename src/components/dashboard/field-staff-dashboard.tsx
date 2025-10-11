"use client"

import type { User, Checkout } from "@/lib/types"
import { DailyActions } from "./daily-actions"
import { TeamPulse } from "./team-activity-feed"
import { MyPriorities } from "./my-priorities"
import { TeamToday } from "./team-today"
import { DashboardGrid } from "./dashboard-grid"
import { DashboardHeader } from "./dashboard-header"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"

interface DashboardProps {
  profile: User;
}

export function FieldStaffDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const checkoutsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10)) : null, [firestore]);
  const { data: checkouts } = useCollection<Checkout>(checkoutsQuery);

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />

      <DashboardGrid className="lg:grid-cols-3">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <DailyActions />
          <MyPriorities />
          <TeamToday />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TeamPulse checkouts={checkouts} />
        </div>
      </DashboardGrid>
    </div>
  )
}
