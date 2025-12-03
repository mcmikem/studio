
"use client"

import type { User, Activity, Checkin } from "@/lib/types"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { useMemoFirebase, useCollection } from "@/firebase"
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore"
import { subDays, startOfDay } from "date-fns"
import { PartnershipPipeline } from '@/components/dashboard/program-manager/partnership-pipeline'
import { QuickInsights } from '@/components/dashboard/program-manager/quick-insights'
import { MyWeeklyPlan } from '@/components/dashboard/my-weekly-plan'
import { DashboardCalendar } from '@/components/dashboard/dashboard-calendar'
import { TeamDeployment } from '@/components/dashboard/team-deployment'
import { useFirestore } from "@/firebase"

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
    <DashboardGrid className="mt-6 lg:grid-cols-2">
        <PartnershipPipeline partnerships={partnerships} isLoading={isLoadingPartnerships} />
        <QuickInsights activities={activities} />
        <TeamDeployment users={users} checkins={checkins} isLoading={isLoadingUsers || isLoadingCheckins} />
        <DashboardCalendar />
        <div className="lg:col-span-2">
            <MyWeeklyPlan />
        </div>
    </DashboardGrid>
  )
}
