
"use client"

import type { User, Activity, Checkin, Program, Checkout } from "@/lib/types"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, Timestamp, limit } from "firebase/firestore"
import { useMemo } from "react"
import { subDays, startOfDay } from "date-fns"
import { useFirestore } from "@/firebase"
import dynamic from 'next/dynamic'
import { Skeleton } from "../ui/skeleton"
import { QuickStatsSummary } from "./quick-stats-summary"
import type { ImpactMetric } from "@/lib/types"
import { DashboardHeader } from "./dashboard-header"
import type { DashboardProps } from "./dashboard-loader"


const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), { loading: () => <Skeleton className="h-64" />, ssr: false });
const ApprovalQueue = dynamic(() => import('@/components/dashboard/approval-queue').then(mod => mod.ApprovalQueue), { loading: () => <Skeleton className="h-64" />, ssr: false });
const EcosystemPulse = dynamic(() => import('@/components/dashboard/ecosystem-pulse').then(mod => mod.EcosystemPulse), { loading: () => <Skeleton className="h-64" />, ssr: false });
const KeyResultsTracker = dynamic(() => import('@/components/plan/key-results-tracker').then(mod => mod.KeyResultsTracker), { loading: () => <Skeleton className="h-64" />, ssr: false });
const TeamPerformanceLeaderboard = dynamic(() => import('@/components/dashboard/team-performance-leaderboard').then(mod => mod.TeamPerformanceLeaderboard), { loading: () => <Skeleton className="h-64" />, ssr: false });
const TeamPulse = dynamic(() => import('@/components/dashboard/team-activity-feed').then(mod => mod.TeamPulse), { loading: () => <Skeleton className="h-96" />, ssr: false });


export function ExecutiveDashboard({ profile }: DashboardProps) {
    const firestore = useFirestore();
    
    const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30), []);

    const activitiesQuery = useMemoFirebase((db) => {
        if (!db) return null;
        return query(
            collection(db, 'activities'),
            where('loggedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)), 
            orderBy('loggedAt', 'desc')
        );
    }, [thirtyDaysAgo]);
    const { data: activities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery, { listen: false });
    
    const usersQuery = useMemoFirebase((db) => db ? query(collection(db, 'users'), orderBy('name')) : null, []);
    const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery, { listen: false });

    const checkinsQuery = useMemoFirebase((db) => {
        if (!db) return null;
        return query(
            collection(db, 'checkins'),
            where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date())))
        );
    }, []);
    const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);

    const programsQuery = useMemoFirebase((db) => db ? query(collection(db, 'programs')) : null, []);
    const { data: programs, isLoading: isLoadingPrograms } = useCollection<Program>(programsQuery, { listen: false });
    
    const metricsQuery = useMemoFirebase((db) => db ? query(collection(db, 'impact-metrics'), orderBy('metric')) : null, []);
    const { data: metrics, isLoading: isLoadingMetrics } = useCollection<ImpactMetric>(metricsQuery, { listen: false });

    const checkoutsQuery = useMemoFirebase((db) => db ? query(collection(db, 'checkouts'), orderBy('timestamp', 'desc'), limit(5)) : null, [firestore]);
    const { data: checkouts } = useCollection<Checkout>(checkoutsQuery);
  
  const isLoading = isLoadingUsers || isLoadingActivities || isLoadingCheckins || isLoadingPrograms || isLoadingMetrics;

  return (
    <div className="flex flex-col gap-6">
        <DashboardHeader profile={profile} />
        <QuickStatsSummary metrics={metrics} />
      
        <KeyResultsTracker />
      
        <DashboardGrid className="lg:grid-cols-3">
            <div className="flex flex-col gap-6">
                <ApprovalQueue />
                <TeamDeployment users={users} checkins={checkins} isLoading={isLoading} />
            </div>
            <div className="flex flex-col gap-6">
                <EcosystemPulse activities={activities} programs={programs} isLoading={isLoading} />
                <TeamPerformanceLeaderboard 
                    users={users} 
                    isLoading={isLoading}
                />
            </div>
              <div className="flex flex-col gap-6">
                <TeamPulse checkouts={checkouts} />
            </div>
        </DashboardGrid>
    </div>
  )
}
