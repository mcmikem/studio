
"use client"

import type { User, Checkout, Checkin } from "@/lib/types"
import { DashboardGrid } from "./dashboard-grid"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit, where, Timestamp } from "firebase/firestore"
import { startOfDay } from "date-fns"
import { useMemo } from "react"
import { Skeleton } from "../ui/skeleton"
import dynamic from "next/dynamic"
import type { DashboardProps } from "./dashboard-loader"

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


export default function DefaultDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();

  const checkoutsQuery = useMemo(() => firestore ? query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(5)) : null, [firestore]);
  const { data: checkouts } = useCollection<Checkout>(checkoutsQuery);
  
  const usersQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery, { listen: false });

  const checkinsQuery = useMemo(() => firestore ? query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date())))) : null, [firestore]);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);

  return (
    <DashboardGrid className="mt-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <DashboardCalendar />
        <MyWeeklyPlan />
      </div>
      <div className="flex flex-col gap-6">
        <TeamDeployment users={users} checkins={checkins} isLoading={isLoadingUsers || isLoadingCheckins} />
        <TeamPulse checkouts={checkouts} />
      </div>
    </DashboardGrid>
  )
}
