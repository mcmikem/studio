"use client"

import type { User, Program, Checkout, ImpactMetric, Partnership, Checkin, Expense } from "@/lib/types"
import { NotificationsList } from "@/components/notifications/notifications-list"
import { ProgramsOverview } from "@/components/dashboard/programs-overview"
import { ManagementQuickLinks } from "@/components/dashboard/management-quick-links"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { TeamPulse } from "@/components/dashboard/team-activity-feed"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, orderBy, limit, where, Timestamp } from "firebase/firestore"
import { DashboardCalendar } from "@/components/dashboard/dashboard-calendar"
import { PartnershipPipeline } from "@/components/dashboard/program-manager/partnership-pipeline"
import { TeamDeployment } from "@/components/dashboard/team-deployment"
import { QuickAddTask } from "@/components/dashboard/quick-add-task"
import { startOfDay } from "date-fns"
import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { BellRing, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"


interface DashboardProps {
  profile: User;
}

export function AdminDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const programsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'programs'), orderBy('deadline')) : null, [firestore]);
  const { data: programs } = useCollection<Program>(programsQuery);

  const checkoutsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10)) : null, [firestore]);
  const { data: checkouts } = useCollection<Checkout>(checkoutsQuery);

  const metricsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'impact-metrics')) : null, [firestore]);
  const { data: metrics } = useCollection<ImpactMetric>(metricsQuery);

  const partnershipsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'partnerships'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: partnerships, isLoading: isLoadingPartnerships } = useCollection<Partnership>(partnershipsQuery);

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const checkinsQuery = useMemoFirebase((db) => {
    if(!firestore) return null;
    return query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date()))))
  }, [firestore]);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);
  const expensesQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'expenses'), where('createdAt', '>=', Timestamp.fromDate(startOfMonth)))
  }, [firestore]);
  const { data: expenses } = useCollection<Expense>(expensesQuery);


  return (
    <DashboardGrid className="lg:grid-cols-2">
        <div className="flex flex-col gap-6">
            <TeamDeployment users={users} checkins={checkins} isLoading={isLoadingUsers || isLoadingCheckins} />
            <PartnershipPipeline partnerships={partnerships} isLoading={isLoadingPartnerships} />
        </div>
        <div className="flex flex-col gap-6">
            <DashboardCalendar />
            <ManagementQuickLinks />
            <TeamPulse checkouts={checkouts} />
        </div>
    </DashboardGrid>
  )
}
