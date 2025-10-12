
"use client"

import type { User, Program, Checkout, ImpactMetric, Partnership, Checkin, Expense } from "@/lib/types"
import { Alerts } from "./alerts"
import { ProgramsOverview } from "./programs-overview"
import { ManagementQuickLinks } from "./management-quick-links"
import { DashboardGrid } from "./dashboard-grid"
import { TeamPulse } from "./team-activity-feed"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit, where, Timestamp } from "firebase/firestore"
import { DailyActions } from "./daily-actions"
import { DashboardCalendar } from "./dashboard-calendar"
import { KeyResultsTracker } from "../plan/key-results-tracker"
import { TeamCoordination } from "./program-manager/team-coordination"
import { PartnershipPipeline } from "./program-manager/partnership-pipeline"
import { SmartReminders } from "./smart-reminders"
import { TeamDeployment } from "./team-deployment"

interface DashboardProps {
  profile: User;
}

export function AdminDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();

  const programsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'programs'), orderBy('deadline')) : null, [firestore]);
  const { data: programs } = useCollection<Program>(programsQuery);

  const checkoutsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10)) : null, [firestore]);
  const { data: checkouts } = useCollection<Checkout>(checkoutsQuery);

  const metricsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'impact-metrics')) : null, [firestore]);
  const { data: metrics } = useCollection<ImpactMetric>(metricsQuery);

  const partnershipsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'partnerships'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: partnerships, isLoading: isLoadingPartnerships } = useCollection<Partnership>(partnershipsQuery);

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
  const { data: users } = useCollection<User>(usersQuery);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const checkinsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(todayStart))) : null, [firestore]);
  const { data: checkins } = useCollection<Checkin>(checkinsQuery);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);
  const expensesQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'expenses'), where('createdAt', '>=', Timestamp.fromDate(startOfMonth)))
  }, [firestore]);
  const { data: expenses } = useCollection<Expense>(expensesQuery);


  return (
    <>
       <DashboardGrid className="mt-6 lg:grid-cols-3">
         <div className="lg:col-span-1 flex flex-col gap-6">
            <DailyActions />
            <SmartReminders profile={profile} />
            <ManagementQuickLinks />
            <Alerts />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
            <TeamDeployment users={users} checkins={checkins} />
            <KeyResultsTracker showAtRisk />
            <TeamCoordination users={users} checkins={checkins} expenses={expenses} />
            <PartnershipPipeline partnerships={partnerships} isLoading={isLoadingPartnerships} />
            <ProgramsOverview programs={programs} />
            <TeamPulse checkouts={checkouts} />
        </div>
      </DashboardGrid>
    </>
  )
}
