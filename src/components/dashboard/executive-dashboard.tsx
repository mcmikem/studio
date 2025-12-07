
"use client"

import type { User, Activity, Checkin, Program } from "@/lib/types"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore"
import { useMemo } from "react"
import { subDays, startOfDay } from "date-fns"
import { useFirestore } from "@/firebase"
import dynamic from 'next/dynamic'
import { Skeleton } from "../ui/skeleton"
import { QuickAddTask } from "./quick-add-task"
import { DashboardHeader } from "./dashboard-header"


const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), { loading: () => <Skeleton className="h-64" />, ssr: false });
const ApprovalQueue = dynamic(() => import('@/components/dashboard/approval-queue').then(mod => mod.ApprovalQueue), { loading: () => <Skeleton className="h-64" />, ssr: false });
const EcosystemPulse = dynamic(() => import('@/components/dashboard/ecosystem-pulse').then(mod => mod.EcosystemPulse), { loading: () => <Skeleton className="h-64" />, ssr: false });
const KeyResultsTracker = dynamic(() => import('@/components/plan/key-results-tracker').then(mod => mod.KeyResultsTracker), { loading: () => <Skeleton className="h-64" />, ssr: false });
const TeamPerformanceLeaderboard = dynamic(() => import('@/components/dashboard/team-performance-leaderboard').then(mod => mod.TeamPerformanceLeaderboard), { loading: () => <Skeleton className="h-64" />, ssr: false });

interface DashboardProps {
  profile: User;
}

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
  
  const isLoading = isLoadingUsers || isLoadingActivities || isLoadingCheckins || isLoadingPrograms;

  return (
      <div className="flex flex-col gap-6">
        <DashboardHeader profile={profile} />
        <QuickAddTask />
        {isLoading ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-6">
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
                <Skeleton className="h-64 lg:col-span-2" />
            </div>
        ) : (
            <DashboardGrid className="mt-6 lg:grid-cols-2">
                <div className="lg:col-span-2 space-y-6">
                    <KeyResultsTracker />
                    <TeamPerformanceLeaderboard 
                        users={users} 
                        isLoading={false}
                    />
                    <EcosystemPulse activities={activities} programs={programs} isLoading={false} />
                </div>
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <ApprovalQueue />
                    <TeamDeployment users={users} checkins={checkins} isLoading={false} />
                </div>
            </DashboardGrid>
        )}
      </div>
  )
}

    