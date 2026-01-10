'use client';

import type { User, Activity, Checkin, Partnership } from "@/lib/types"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore"
import { subDays, startOfDay } from "date-fns"
import { useFirestore } from "@/firebase"
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardProps } from "./dashboard-loader"
import { useState } from "react"

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

export function ProgramManagerDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const [partnerships, setPartnerships] = useState<Partnership[] | null>(null);
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [checkins, setCheckins] = useState<Checkin[] | null>(null);

  const partnershipsQuery = useMemoFirebase((db) => db ? query(collection(db, 'partnerships'), orderBy('createdAt', 'desc')) : null, []);
  const activitiesQuery = useMemoFirebase((db) => {
    if (!db) return null;
    const sixWeeksAgo = startOfDay(subDays(new Date(), 42));
    return query(collection(db, 'activities'), where('loggedAt', '>=', Timestamp.fromDate(sixWeeksAgo)), orderBy('loggedAt', 'desc'));
  }, []);
  const usersQuery = useMemoFirebase((db) => db ? query(collection(db, 'users')) : null, []);
  const checkinsQuery = useMemoFirebase((db) => {
    if(!db) return null;
    return query(collection(db, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date()))));
  }, []);

  useCollection<Partnership>(partnershipsQuery, { listen: true, onData: setPartnerships });
  useCollection<Activity>(activitiesQuery, { listen: false, onData: setActivities });
  useCollection<User>(usersQuery, { listen: true, onData: setUsers });
  useCollection<Checkin>(checkinsQuery, { listen: true, onData: setCheckins });

  const isLoading = !partnerships || !users || !checkins;

  return (
    <DashboardGrid className="mt-6 lg:grid-cols-2">
        <PartnershipPipeline partnerships={partnerships} isLoading={isLoading} />
        <QuickInsights activities={activities} />
        <TeamDeployment users={users} checkins={checkins} isLoading={isLoading} />
        <DashboardCalendar />
        <div className="lg:col-span-2">
            <MyWeeklyPlan />
        </div>
    </DashboardGrid>
  );
}
