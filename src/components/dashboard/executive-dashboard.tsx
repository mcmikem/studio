
"use client"

import type { User, Program, Checkout, ImpactMetric, KeyResult, Activity, Checkin, Expense, Partnership } from "@/lib/types"
import { ManagementQuickLinks } from "./management-quick-links"
import { DashboardGrid } from "./dashboard-grid"
import { TeamPulse } from "./team-activity-feed"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, Timestamp, limit } from "firebase/firestore"
import { useMemo } from "react"
import { subDays, startOfWeek, isAfter, subMonths, startOfDay, subWeeks } from "date-fns"
import { Globe, TrendingUp, BellRing, ArrowRight } from "lucide-react"
import { TeamDeployment } from "./team-deployment"
import { formatCurrency } from "@/lib/utils"
import { ApprovalQueue } from "./approval-queue"
import { TeamPerformanceLeaderboard } from "./team-performance-leaderboard"


interface DashboardProps {
  profile: User;
}

export function ExecutiveDashboard({ profile }: DashboardProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    
    const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30), []);

    const metricsQuery = useMemo(() => firestore ? query(collection(firestore, 'impact-metrics')) : null, [firestore]);
    const { data: metrics } = useCollection<ImpactMetric>(metricsQuery);
    
    const activitiesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'activities'),
            where('loggedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)), 
            orderBy('loggedAt', 'desc')
        );
    }, [firestore, thirtyDaysAgo]);
    const { data: activities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery);
    
    const checkoutsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'checkouts'),
            where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)),
            orderBy('timestamp', 'desc')
        );
    }, [firestore, thirtyDaysAgo]);
    const { data: checkouts, isLoading: isLoadingCheckouts } = useCollection<Checkout>(checkoutsQuery);
    
    const usersQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

    const checkinsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'checkins'),
            where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo))
        );
    }, [firestore, thirtyDaysAgo]);
    const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);

    const programsQuery = useMemo(() => firestore ? query(collection(firestore, 'programs')) : null, [firestore]);
    const { data: programs } = useCollection<Program>(programsQuery);

  return (
    <>
       <DashboardGrid className="mt-6">
            <TeamPerformanceLeaderboard 
                activities={activities}
                checkins={checkins} 
                checkouts={checkouts}
                users={users} 
                isLoading={isLoadingActivities || isLoadingUsers || isLoadingCheckins || isLoadingCheckouts}
            />
      </DashboardGrid>
    </>
  )
}
