
"use client"

import type { User, Program, Partnership, Checkout, Checkin, Expense, Activity } from "@/lib/types"
import { DailyActions } from "./daily-actions"
import { DashboardGrid } from "./dashboard-grid"
import { ManagementQuickLinks } from "./management-quick-links"
import { KeyResultsTracker } from "../plan/key-results-tracker"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where, orderBy, Timestamp, limit } from "firebase/firestore"
import { startOfDay, subDays } from "date-fns"
import { PartnershipPipeline } from "./program-manager/partnership-pipeline"
import { QuickInsights } from "./program-manager/quick-insights"
import { TeamDeployment } from "./team-deployment"
import { DashboardCalendar } from "./dashboard-calendar"
import { QuickAddTask } from "./quick-add-task"
import { SmartReminders } from "./smart-reminders"
import { useMemo } from "react"
import { TodaysFocus } from "./todays-focus"


interface DashboardProps {
  profile: User;
}
export function ProgramManagerDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const partnershipsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'partnerships'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: partnerships, isLoading: isLoadingPartnerships } = useCollection<Partnership>(partnershipsQuery);

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const checkinsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date())))) : null, [firestore]);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);
  const expensesQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'expenses'), where('createdAt', '>=', Timestamp.fromDate(startOfMonth)))
  }, [firestore]);
  const { data: expenses } = useCollection<Expense>(expensesQuery);
  
  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const fourteenDaysAgo = startOfDay(subDays(new Date(), 14));
    return query(collection(firestore, 'activities'), where('loggedAt', '>=', Timestamp.fromDate(fourteenDaysAgo)), orderBy('loggedAt', 'desc'))
  }, [firestore]);

  const { data: activities } = useCollection<Activity>(activitiesQuery);
  
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
  
  const { data: userCheckins, isLoading: isLoadingUserCheckin } = useCollection<Checkin>(latestCheckinQuery);

  const latestCheckin = useMemo(() => {
    if (!userCheckins || userCheckins.length === 0) return null;
    return userCheckins.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())[0];
  }, [userCheckins]);


  return (
    <>
    {latestCheckin && <TodaysFocus checkin={latestCheckin} isLoading={isLoadingUserCheckin} />}
     <DashboardGrid className="mt-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
            <KeyResultsTracker showAtRisk />
            <TeamDeployment users={users} checkins={checkins} isLoading={isLoadingUsers || isLoadingCheckins}/>
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
            <DailyActions />
            <QuickAddTask />
            <SmartReminders profile={profile} />
            <DashboardCalendar />
            <PartnershipPipeline partnerships={partnerships} isLoading={isLoadingPartnerships} />
            <QuickInsights activities={activities} />
            <ManagementQuickLinks />
        </div>
      </DashboardGrid>
    </>
  )
}
