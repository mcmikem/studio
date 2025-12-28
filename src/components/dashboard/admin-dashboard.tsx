
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
import { Skeleton } from "../ui/skeleton"


interface DashboardProps {
  profile: User;
}

export function AdminDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const programsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'programs'), orderBy('deadline')) : null, [firestore]);
  const { data: programs, isLoading: isLoadingPrograms } = useCollection<Program>(programsQuery);

  const checkoutsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10)) : null, [firestore]);
  const { data: checkouts, isLoading: isLoadingCheckouts } = useCollection<Checkout>(checkoutsQuery);

  const partnershipsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'partnerships'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: partnerships, isLoading: isLoadingPartnerships } = useCollection<Partnership>(partnershipsQuery);

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const checkinsQuery = useMemoFirebase((db) => {
    if(!firestore) return null;
    return query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date()))))
  }, [firestore]);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);

  const isLoading = isLoadingUsers || isLoadingCheckins || isLoadingPartnerships || isLoadingCheckouts || isLoadingPrograms;

  return (
    <DashboardGrid className="mt-6 lg:grid-cols-2">
        {isLoading ? (
            <>
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
            </>
        ) : (
            <>
                <div className="flex flex-col gap-6">
                    <TeamDeployment users={users} checkins={checkins} isLoading={false} />
                    <PartnershipPipeline partnerships={partnerships} isLoading={false} />
                </div>
                <div className="flex flex-col gap-6">
                    <DashboardCalendar />
                    <ManagementQuickLinks />
                    <TeamPulse checkouts={checkouts} />
                </div>
            </>
        )}
    </DashboardGrid>
  )
}

    

    