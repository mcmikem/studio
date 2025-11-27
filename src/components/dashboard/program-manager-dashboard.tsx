"use client"

import type { User, Program, Partnership, Checkout, Checkin, Expense, Activity } from "@/lib/types"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { ManagementQuickLinks } from "@/components/dashboard/management-quick-links"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, Timestamp, limit } from "firebase/firestore"
import { startOfDay, subDays } from "date-fns"
import { PartnershipPipeline } from "@/components/dashboard/program-manager/partnership-pipeline"
import { QuickInsights } from "@/components/dashboard/program-manager/quick-insights"
import { TeamDeployment } from "@/components/dashboard/team-deployment"
import { DashboardCalendar } from "@/components/dashboard/dashboard-calendar"
import { QuickAddTask } from "@/components/dashboard/quick-add-task"
import { MyWeeklyPlan } from "@/components/dashboard/my-weekly-plan"
import { ApprovalQueue } from "@/components/dashboard/approval-queue"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


interface DashboardProps {
  profile: User;
}
export function ProgramManagerDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();

  const partnershipsQuery = useMemoFirebase((db) => db ? query(collection(db, 'partnerships'), orderBy('createdAt', 'desc')) : null, []);
  const { data: partnerships, isLoading: isLoadingPartnerships } = useCollection<Partnership>(partnershipsQuery);

  const usersQuery = useMemoFirebase((db) => db ? query(collection(db, 'users'), orderBy('name')) : null, []);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const checkinsQuery = useMemoFirebase((db) => {
    const startOfToday = startOfDay(new Date());
    return db ? query(collection(db, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfToday))) : null;
  }, []);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);
  
  const activitiesQuery = useMemoFirebase((db) => {
    const sixWeeksAgo = startOfDay(subDays(new Date(), 42));
    return db ? query(collection(db, 'activities'), where('loggedAt', '>=', Timestamp.fromDate(sixWeeksAgo)), orderBy('loggedAt', 'desc')) : null;
  }, []);

  const { data: activities } = useCollection<Activity>(activitiesQuery);
  

  return (
    <>
     <DashboardGrid className="mt-6">
        <PartnershipPipeline partnerships={partnerships} isLoading={isLoadingPartnerships} />
        <QuickInsights activities={activities} />
      </DashboardGrid>
    </>
  )
}
