
"use client"

import type { User, Activity, Checkin, Program } from "@/lib/types"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore"
import { useMemo } from "react"
import { subDays, startOfDay } from "date-fns"
import { TeamDeployment } from '@/components/dashboard/team-deployment'
import { ApprovalQueue } from '@/components/dashboard/approval-queue'
import { EcosystemPulse } from '@/components/dashboard/ecosystem-pulse'
import { KeyResultsTracker } from '@/components/plan/key-results-tracker'
import { TeamPerformanceLeaderboard } from '@/components/dashboard/team-performance-leaderboard'
import { useFirestore } from "@/firebase"

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

  return (
    <DashboardGrid className="mt-6 lg:grid-cols-2">
        <div className="lg:col-span-2 space-y-6">
            <KeyResultsTracker />
            <TeamPerformanceLeaderboard 
                users={users} 
                isLoading={isLoadingUsers}
            />
            <EcosystemPulse activities={activities} programs={programs} isLoading={isLoadingActivities || isLoadingPrograms} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
             <ApprovalQueue />
             <TeamDeployment users={users} checkins={checkins} isLoading={isLoadingUsers || isLoadingCheckins} />
        </div>
    </DashboardGrid>
  )
}
