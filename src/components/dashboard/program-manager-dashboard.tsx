
"use client"

import type { User, Program, Partnership, Checkout, Checkin, Expense, Activity } from "@/lib/types"
import { DashboardGrid } from "./dashboard-grid"
import { ManagementQuickLinks } from "./management-quick-links"
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
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { useMemoFirebase } from "@/firebase/provider"


interface DashboardProps {
  profile: User;
}
export function ProgramManagerDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const partnershipsQuery = useMemoFirebase((db) => query(collection(db, 'partnerships'), orderBy('createdAt', 'desc')), []);
  const { data: partnerships, isLoading: isLoadingPartnerships } = useCollection<Partnership>(partnershipsQuery);

  const usersQuery = useMemoFirebase((db) => query(collection(db, 'users'), orderBy('name')), []);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const checkinsQuery = useMemoFirebase((db) => {
    const startOfToday = startOfDay(new Date());
    return query(collection(db, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfToday)));
  }, []);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);
  
  const activitiesQuery = useMemoFirebase((db) => {
    const sixWeeksAgo = startOfDay(subDays(new Date(), 42));
    return query(collection(db, 'activities'), where('loggedAt', '>=', Timestamp.fromDate(sixWeeksAgo)), orderBy('loggedAt', 'desc'))
  }, []);

  const { data: activities } = useCollection<Activity>(activitiesQuery);
  

  return (
    <>
     <DashboardGrid className="mt-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader><CardTitle>Key Results Tracker</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">This component has been temporarily removed to resolve a build error. It will be restored shortly.</p></CardContent>
            </Card>
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
