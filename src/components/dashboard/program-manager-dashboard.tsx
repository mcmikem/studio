
"use client"

import type { User, Program, Partnership, Checkout, Checkin, Expense, Activity } from "@/lib/types"
import { DashboardGrid } from "./dashboard-grid"
import { ManagementQuickLinks } from "./management-quick-links"
import { KeyResultsTracker } from "../plan/key-results-tracker"
import { useCollection, useFirestore, useUser } from "@/firebase"
import { collection, query, where, orderBy, Timestamp, limit } from "firebase/firestore"
import { startOfDay, subDays } from "date-fns"
import { PartnershipPipeline } from "./program-manager/partnership-pipeline"
import { QuickInsights } from "./program-manager/quick-insights"
import { TeamDeployment } from "./team-deployment"
import { DashboardCalendar } from "./dashboard-calendar"
import { QuickAddTask } from "./quick-add-task"
import { useMemo } from "react"
import { MyWeeklyPlan } from "./my-weekly-plan"
import { ApprovalQueue } from "./approval-queue"


interface DashboardProps {
  profile: User;
}
export function ProgramManagerDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const partnershipsQuery = useMemo(() => firestore ? query(collection(firestore, 'partnerships'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: partnerships, isLoading: isLoadingPartnerships } = useCollection<Partnership>(partnershipsQuery);

  const usersQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const checkinsQuery = useMemo(() => {
    if (!firestore) return null;
    const startOfToday = startOfDay(new Date());
    return query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfToday)));
  }, [firestore]);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);
  
  const activitiesQuery = useMemo(() => {
    if (!firestore) return null;
    const sixWeeksAgo = startOfDay(subDays(new Date(), 42));
    return query(collection(firestore, 'activities'), where('loggedAt', '>=', Timestamp.fromDate(sixWeeksAgo)), orderBy('loggedAt', 'desc'))
  }, [firestore]);

  const { data: activities } = useCollection<Activity>(activitiesQuery);
  

  return (
    <>
     <DashboardGrid className="mt-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
            <KeyResultsTracker showAtRisk />
            <TeamDeployment users={users} checkins={checkins} isLoading={isLoadingUsers || isLoadingCheckins}/>
            <QuickInsights activities={activities} />
            <ManagementQuickLinks />
        </div>
        <div className="flex flex-col gap-6">
            <ApprovalQueue />
            <DashboardCalendar />
            <PartnershipPipeline partnerships={partnerships} isLoading={isLoadingPartnerships} />
            <MyWeeklyPlan />
        </div>
      </DashboardGrid>
    </>
  )
}
