
"use client"

import type { User, Activity, Checkin } from "@/lib/types"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { useMemoFirebase, useCollection } from "@/firebase"
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore"
import { subDays, startOfDay } from "date-fns"
import { PartnershipPipeline } from "@/components/dashboard/program-manager/partnership-pipeline"
import { QuickInsights } from "@/components/dashboard/program-manager/quick-insights"
import { Skeleton } from "../ui/skeleton"
import dynamic from "next/dynamic"
import { MyWeeklyPlan } from "./my-weekly-plan"
import { DashboardCalendar } from "./dashboard-calendar"
import { TeamDeployment } from "./team-deployment"
import { useFirestore } from "@/firebase"

const DynamicPartnershipPipeline = dynamic(() => import('@/components/dashboard/program-manager/partnership-pipeline').then(mod => mod.PartnershipPipeline), { loading: () => <Skeleton className="h-64" />, ssr: false });
const DynamicQuickInsights = dynamic(() => import('@/components/dashboard/program-manager/quick-insights').then(mod => mod.QuickInsights), { loading: () => <Skeleton className="h-64" />, ssr: false });
const DynamicMyWeeklyPlan = dynamic(() => import('@/components/dashboard/my-weekly-plan').then(mod => mod.MyWeeklyPlan), { loading: () => <Skeleton className="h-64" />, ssr: false });
const DynamicDashboardCalendar = dynamic(() => import('@/components/dashboard/dashboard-calendar').then(mod => mod.DashboardCalendar), { loading: () => <Skeleton className="h-64" />, ssr: false });


interface DashboardProps {
  profile: User;
}
export function ProgramManagerDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const partnershipsQuery = useMemoFirebase((db) => db ? query(collection(db, 'partnerships'), orderBy('createdAt', 'desc')) : null, []);
  const { data: partnerships, isLoading: isLoadingPartnerships } = useCollection(partnershipsQuery);

  
  const activitiesQuery = useMemoFirebase((db) => {
    if (!db) return null;
    const sixWeeksAgo = startOfDay(subDays(new Date(), 42));
    return query(collection(db, 'activities'), where('loggedAt', '>=', Timestamp.fromDate(sixWeeksAgo)), orderBy('loggedAt', 'desc'))
  }, []);

  const { data: activities } = useCollection<Activity>(activitiesQuery, { listen: false });

  const usersQuery = useMemoFirebase((db) => db ? query(collection(db, 'users')) : null, []);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);
  const checkinsQuery = useMemoFirebase((db) => {
    if(!db) return null;
    return query(collection(db, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date()))))
  }, []);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);
  

  return (
    <>
     <DashboardGrid className="mt-6 lg:grid-cols-2">
        <DynamicPartnershipPipeline partnerships={partnerships} isLoading={isLoadingPartnerships} />
        <DynamicQuickInsights activities={activities} />
        <TeamDeployment users={users} checkins={checkins} isLoading={isLoadingUsers || isLoadingCheckins} />
        <DynamicDashboardCalendar />
        <div className="lg:col-span-2">
            <DynamicMyWeeklyPlan />
        </div>
      </DashboardGrid>
    </>
  )
}
