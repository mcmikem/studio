
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
import { KeyResultsTracker } from "@/components/plan/key-results-tracker"
import { EcosystemPulse } from "@/components/dashboard/ecosystem-pulse"


interface DashboardProps {
  profile: User;
}

export function ExecutiveDashboard({ profile }: DashboardProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    
    const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30), []);

    const metricsQuery = useMemoFirebase((db) => db ? query(collection(db, 'impact-metrics')) : null, []);
    const { data: metrics } = useCollection<ImpactMetric>(metricsQuery);
    
    const activitiesQuery = useMemoFirebase((db) => {
        if (!db) return null;
        return query(
            collection(db, 'activities'),
            where('loggedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)), 
            orderBy('loggedAt', 'desc')
        );
    }, [thirtyDaysAgo]);
    const { data: activities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery);
    
    const checkoutsQuery = useMemoFirebase((db) => {
        if (!db) return null;
        return query(
            collection(db, 'checkouts'),
            where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)),
            orderBy('timestamp', 'desc')
        );
    }, [thirtyDaysAgo]);
    const { data: checkouts, isLoading: isLoadingCheckouts } = useCollection<Checkout>(checkoutsQuery);
    
    const usersQuery = useMemoFirebase((db) => db ? query(collection(db, 'users'), orderBy('name')) : null, []);
    const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

    const checkinsQuery = useMemoFirebase((db) => {
        if (!db) return null;
        return query(
            collection(db, 'checkins'),
            where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date())))
        );
    }, []);
    const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);

    const programsQuery = useMemoFirebase((db) => db ? query(collection(db, 'programs')) : null, []);
    const { data: programs, isLoading: isLoadingPrograms } = useCollection<Program>(programsQuery);

  return (
    <>
       <DashboardGrid className="mt-6 lg:grid-cols-3">
            <div className="lg:col-span-2 flex flex-col gap-6">
                 <KeyResultsTracker />
                 <TeamPerformanceLeaderboard 
                    activities={activities}
                    checkins={checkins} 
                    checkouts={checkouts}
                    users={users} 
                    isLoading={isLoadingActivities || isLoadingUsers || isLoadingCheckins || isLoadingCheckouts}
                />
            </div>
             <div className="lg:col-span-1 flex flex-col gap-6">
                <EcosystemPulse activities={activities} programs={programs} isLoading={isLoadingActivities || isLoadingPrograms} />
                <ApprovalQueue />
                <TeamDeployment users={users} checkins={checkins} isLoading={isLoadingUsers || isLoadingCheckins} />
            </div>
      </DashboardGrid>
    </>
  )
}
