
"use client"

import type { User, Activity, Checkin } from "@/lib/types"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore"
import { subDays, startOfDay } from "date-fns"
import { useFirestore } from "@/firebase"
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { AppHeader } from "../header"
import { DashboardHeader } from "./dashboard-header"
import { QuickAddTask } from "./quick-add-task"

const PartnershipPipeline = dynamic(() => import('@/components/dashboard/program-manager/partnership-pipeline').then(mod => mod.PartnershipPipeline), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});

const QuickInsights = dynamic(() => import('@/components/dashboard/program-manager/quick-insights').then(mod => mod.QuickInsights), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});

const MyWeeklyPlan = dynamic(() => import('@/components/dashboard/my-weekly-plan').then(mod => mod.MyWeeklyPlan), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});

const DashboardCalendar = dynamic(() => import('@/components/dashboard/dashboard-calendar').then(mod => mod.DashboardCalendar), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});

const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});


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
      <AppHeader />
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <DashboardHeader profile={profile} />
        <QuickAddTask />
        <DashboardGrid className="mt-6 lg:grid-cols-2">
            <PartnershipPipeline partnerships={partnerships} isLoading={isLoadingPartnerships} />
            <QuickInsights activities={activities} />
            <TeamDeployment users={users} checkins={checkins} isLoading={isLoadingUsers || isLoadingCheckins} />
            <DashboardCalendar />
            <div className="lg:col-span-2">
                <MyWeeklyPlan />
            </div>
        </DashboardGrid>
      </div>
    </>
  )
}
