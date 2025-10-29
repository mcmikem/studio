
"use client"

import type { User, Checkout, ImpactMetric, Checkin } from "@/lib/types"
import { DashboardGrid } from "./dashboard-grid"
import { TeamPulse } from "./team-activity-feed"
import { DailyActions } from "./daily-actions"
import { DashboardCalendar } from "./dashboard-calendar"
import { Alerts } from "./alerts"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { QuickAddTask } from "./quick-add-task"

interface DashboardProps {
  profile: User;
}

export function DefaultDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const checkoutsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10)) : null, [firestore]);
  const { data: checkouts } = useCollection<Checkout>(checkoutsQuery);

  return (
      <DashboardGrid className="mt-6 lg:grid-cols-3">
         <div className="lg:col-span-1 flex flex-col gap-6">
          <QuickAddTask />
          <DashboardCalendar />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
           <Alerts />
          <TeamPulse checkouts={checkouts} />
        </div>
      </DashboardGrid>
  )
}
