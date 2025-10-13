
"use client"

import type { User, Checkout, ImpactMetric, Checkin } from "@/lib/types"
import { DashboardGrid } from "./dashboard-grid"
import { TeamPulse } from "./team-activity-feed"
import { DailyActions } from "./daily-actions"
import { TeamDeployment } from "./team-deployment"
import { DashboardCalendar } from "./dashboard-calendar"
import { Alerts } from "./alerts"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit, where, Timestamp } from "firebase/firestore"
import { startOfDay } from "date-fns"
import { QuickAddTask } from "./quick-add-task"

interface DashboardProps {
  profile: User;
}

export function DefaultDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();

  const checkoutsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10)) : null, [firestore]);
  const { data: checkouts } = useCollection<Checkout>(checkoutsQuery);

  const metricsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'impact-metrics')) : null, [firestore]);
  const { data: metrics } = useCollection<ImpactMetric>(metricsQuery);
  
  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
  const { data: users } = useCollection<User>(usersQuery);

  const todayStart = startOfDay(new Date('2025-10-13T12:00:00Z'));
  const checkinsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(todayStart))) : null, [firestore]);
  const { data: checkins } = useCollection<Checkin>(checkinsQuery);


  return (
    <>
      <DashboardGrid className="mt-6 lg:grid-cols-3">
         <div className="lg:col-span-1 flex flex-col gap-6">
          <DailyActions />
          <QuickAddTask />
          <DashboardCalendar />
          <TeamDeployment users={users} checkins={checkins} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
           <Alerts />
          <TeamPulse checkouts={checkouts} />
        </div>
      </DashboardGrid>
    </>
  )
}
