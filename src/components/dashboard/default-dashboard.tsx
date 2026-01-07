
"use client"

import type { User, Checkout, Checkin } from "@/lib/types"
import { DashboardGrid } from "./dashboard-grid"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit, where, Timestamp } from "firebase/firestore"
import { startOfDay } from "date-fns"
import { useMemo, useState, useEffect } from "react"
import { Skeleton } from "../ui/skeleton"
import dynamic from "next/dynamic"
import { DashboardHeader } from "./dashboard-header"

const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});
const TeamPulse = dynamic(() => import('@/components/dashboard/team-activity-feed').then(mod => mod.TeamPulse), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});
const DashboardCalendar = dynamic(() => import('@/components/dashboard/dashboard-calendar').then(mod => mod.DashboardCalendar), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});
const MyWeeklyPlan = dynamic(() => import('@/components/dashboard/my-weekly-plan').then(mod => mod.MyWeeklyPlan), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});


export function DefaultDashboard() {
  const firestore = useFirestore();
  const [checkouts, setCheckouts] = useState<Checkout[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [checkins, setCheckins] = useState<Checkin[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Queries are memoized but not executed immediately.
  const checkoutsQuery = useMemoFirebase((db) => db ? query(collection(db, 'checkouts'), orderBy('timestamp', 'desc'), limit(5)) : null);
  const usersQuery = useMemoFirebase((db) => db ? query(collection(db, 'users'), orderBy('name')) : null);
  const checkinsQuery = useMemoFirebase((db) => db ? query(collection(db, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date())))) : null);

  useEffect(() => {
    let isMounted = true;
    
    // Defer data fetching until after the initial render.
    const fetchData = async () => {
        if (!firestore) {
            setIsLoading(false);
            return;
        };

        try {
            const [checkoutsSnap, usersSnap, checkinsSnap] = await Promise.all([
                checkoutsQuery ? useCollection<Checkout>(checkoutsQuery, { listen: false }) : Promise.resolve({ data: [] }),
                usersQuery ? useCollection<User>(usersQuery, { listen: false }) : Promise.resolve({ data: [] }),
                checkinsQuery ? useCollection<Checkin>(checkinsQuery, { listen: false }) : Promise.resolve({ data: [] }),
            ]);

            if (isMounted) {
                setCheckouts((checkoutsSnap as any).data || []);
                setUsers((usersSnap as any).data || []);
                setCheckins((checkinsSnap as any).data || []);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            if (isMounted) {
                setIsLoading(false);
            }
        }
    };
    
    fetchData();

    return () => {
        isMounted = false;
    };
  }, [firestore, checkoutsQuery, usersQuery, checkinsQuery]);


  return (
    <div className="flex flex-col gap-6">
        <DashboardHeader profile={{id: 'public', name: 'Guest', role: 'Guest', email: ''}} title="Welcome to Omuto Central"/>
        <DashboardGrid className="lg:grid-cols-2">
        <div className="flex flex-col gap-6">
            <DashboardCalendar />
            <MyWeeklyPlan />
        </div>
        <div className="flex flex-col gap-6">
            <TeamDeployment users={users} checkins={checkins} isLoading={isLoading} />
            <TeamPulse checkouts={checkouts} />
        </div>
        </DashboardGrid>
    </div>
  )
}
