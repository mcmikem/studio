
"use client"

import type { User, Program, Checkout, ImpactMetric, KeyResult, Activity, Checkin, Expense, Partnership } from "@/lib/types"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, Timestamp, limit } from "firebase/firestore"
import { useMemo } from "react"
import { subDays, startOfDay } from "date-fns"
import { TeamDeployment } from "@/components/dashboard/team-deployment"
import { ApprovalQueue } from "@/components/dashboard/approval-queue"
import { TeamPerformanceLeaderboard } from "@/components/dashboard/team-performance-leaderboard"


interface DashboardProps {
  profile: User;
}

export function ExecutiveDashboard({ profile }: DashboardProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    
    const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30), []);

    const metricsQuery = useMemoFirebase((db) => firestore ? query(collection(firestore, 'impact-metrics')) : null, [firestore]);
    const { data: metrics } = useCollection<ImpactMetric>(metricsQuery);
    
    const activitiesQuery = useMemoFirebase((db) => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'activities'),
            where('loggedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)), 
            orderBy('loggedAt', 'desc')
        );
    }, [firestore, thirtyDaysAgo]);
    const { data: activities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery);
    
    const checkoutsQuery = useMemoFirebase((db) => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'checkouts'),
            where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)),
            orderBy('timestamp', 'desc')
        );
    }, [firestore, thirtyDaysAgo]);
    const { data: checkouts, isLoading: isLoadingCheckouts } = useCollection<Checkout>(checkoutsQuery);
    
    const usersQuery = useMemoFirebase((db) => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

    const checkinsQuery = useMemoFirebase((db) => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'checkins'),
            where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date())))
        );
    }, [firestore]);
    const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);

    const programsQuery = useMemoFirebase((db) => firestore ? query(collection(firestore, 'programs')) : null, [firestore]);
    const { data: programs } = useCollection<Program>(programsQuery);

  return (
    <>
       <DashboardGrid className="mt-6 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
                 <TeamPerformanceLeaderboard 
                    activities={activities}
                    checkins={checkins} 
                    checkouts={checkouts}
                    users={users} 
                    isLoading={isLoadingActivities || isLoadingUsers || isLoadingCheckins || isLoadingCheckouts}
                />
            </div>
             <div className="flex flex-col gap-6">
                <ApprovalQueue />
                <TeamDeployment users={users} checkins={checkins} isLoading={isLoadingUsers || isLoadingCheckins} />
            </div>
      </DashboardGrid>
    </>
  )
}
