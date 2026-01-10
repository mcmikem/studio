
"use client"

import type { User, Checkout, Checkin } from "@/lib/types"
import { DashboardGrid } from "./dashboard-grid"
import { Skeleton } from "../ui/skeleton"
import dynamic from "next/dynamic"
import { DashboardHeader } from "./dashboard-header"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit, where, Timestamp } from "firebase/firestore"
import { startOfDay } from "date-fns"

const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});
const TeamPulse = dynamic(() => import('@/components/dashboard/team-activity-feed').then(mod => mod.TeamPulse), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});
const DashboardCalendar = dynamic(() => import('@/components/dashboard/dashboard-calendar').then(mod => mod.DashboardCalendar), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});
const MyWeeklyPlan = dynamic(() => import('@/components/dashboard/my-weekly-plan').then(mod => mod.MyWeeklyPlan), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});

export function DefaultDashboard() {
  const firestore = useFirestore()
  const usersQuery = useMemoFirebase((db) => db ? query(collection(db, "users"), orderBy("name")) : null, [firestore])
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery)
  const checkinsQuery = useMemoFirebase((db) => {
    if (!db) return null
    return query(collection(db, "checkins"), where("timestamp", ">=", Timestamp.fromDate(startOfDay(new Date()))))
  }, [firestore])
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery)
  const checkoutsQuery = useMemoFirebase((db) => db ? query(collection(db, "checkouts"), orderBy("timestamp", "desc"), limit(5)) : null, [firestore])
  const { data: checkouts, isLoading: isLoadingCheckouts } = useCollection<Checkout>(checkoutsQuery)

  const isLoading = isLoadingUsers || isLoadingCheckins || isLoadingCheckouts

  return (
    <div className="flex flex-col gap-6">
        <DashboardHeader profile={{id: 'public', name: 'Guest', role: 'Guest', email: ''}} title="Welcome to Omuto Central"/>
        <DashboardGrid className="lg:grid-cols-2">
            <div className="flex flex-col gap-6">
                <DashboardCalendar />
                <MyWeeklyPlan />
            </div>
            <div className="flex flex-col gap-6">
                <TeamDeployment users={users} checkins={checkins} isLoading={isLoading} />
                <TeamPulse checkouts={checkouts} />
            </div>
        </DashboardGrid>
    </div>
  )
}
