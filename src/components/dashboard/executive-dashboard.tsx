
"use client"

import type { User, Activity, Checkin } from "@/lib/types"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore"
import { useMemo } from "react"
import { subDays, startOfDay } from "date-fns"
import dynamic from "next/dynamic"
import { Skeleton } from "../ui/skeleton"

const DynamicTeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), { loading: () => <Skeleton className="h-48" />, ssr: false });
const DynamicApprovalQueue = dynamic(() => import('@/components/dashboard/approval-queue').then(mod => mod.ApprovalQueue), { loading: () => <Skeleton className="h-64" />, ssr: false });
const DynamicEcosystemPulse = dynamic(() => import('@/components/dashboard/ecosystem-pulse').then(mod => mod.EcosystemPulse), { loading: () => <Skeleton className="h-64" />, ssr: false });
const DynamicKeyResultsTracker = dynamic(() => import('@/components/plan/key-results-tracker').then(mod => mod.KeyResultsTracker), { loading: () => <Skeleton className="h-64" />, ssr: false });
const DynamicTeamPerformanceLeaderboard = dynamic(() => import('@/components/dashboard/team-performance-leaderboard').then(mod => mod.TeamPerformanceLeaderboard), { loading: () => <Skeleton className="h-64" />, ssr: false });

interface DashboardProps {
  profile: User;
}

export function ExecutiveDashboard({ profile }: DashboardProps) {
    
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

  return (
    <DashboardGrid className="mt-6 lg:grid-cols-2">
        <div className="lg:col-span-2 space-y-6">
            <DynamicKeyResultsTracker />
            <DynamicTeamPerformanceLeaderboard 
                users={users} 
                isLoading={isLoadingUsers}
            />
            <DynamicEcosystemPulse activities={activities} programs={programs} isLoading={isLoadingActivities || isLoadingPrograms} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <DynamicApprovalQueue />
             <DynamicTeamDeployment users={users} checkins={checkins} isLoading={isLoadingUsers || isLoadingCheckins} />
        </div>
    </DashboardGrid>
  )
}
