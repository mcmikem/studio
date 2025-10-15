
"use client"

import type { User, Checkout, ImpactMetric, Checkin } from "@/lib/types"
import { DashboardGrid } from "./dashboard-grid"
import { TeamPulse } from "./team-activity-feed"
import { DailyActions } from "./daily-actions"
import { DashboardCalendar } from "./dashboard-calendar"
import { Alerts } from "./alerts"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, orderBy, limit, where, Timestamp } from "firebase/firestore"
import { startOfDay } from "date-fns"
import { QuickAddTask } from "./quick-add-task"
import { TodaysFocus } from "./todays-focus"
import { useMemo } from "react"

interface DashboardProps {
  profile: User;
}

export function DefaultDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const checkoutsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10)) : null, [firestore]);
  const { data: checkouts } = useCollection<Checkout>(checkoutsQuery);

  const latestCheckinQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    return query(
      collection(firestore, 'checkins'),
      where('userId', '==', user.uid),
      where('timestamp', '>=', todayTimestamp)
    );
  }, [user, firestore]);

  const { data: checkins, isLoading: isLoadingCheckin } = useCollection<Checkin>(latestCheckinQuery);

  const latestCheckin = useMemo(() => {
    if (!checkins || checkins.length === 0) return null;
    return checkins.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())[0];
  }, [checkins]);

  return (
    <>
       {latestCheckin && <TodaysFocus checkin={latestCheckin} isLoading={isLoadingCheckin} />}
      <DashboardGrid className="mt-6 lg:grid-cols-3">
         <div className="lg:col-span-1 flex flex-col gap-6">
          <DailyActions />
          <QuickAddTask />
          <DashboardCalendar />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
           <Alerts />
          <TeamPulse checkouts={checkouts} />
        </div>
      </DashboardGrid>
    </>
  )
}
