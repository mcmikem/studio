
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
import { getDocs } from 'firebase/firestore';


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

  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      if (!firestore) {
        if(isMounted) setIsLoading(false);
        return;
      }
      
      setIsLoading(true);

      try {
        const checkoutsQuery = query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(5));
        const usersQuery = query(collection(firestore, 'users'), orderBy('name'));
        const checkinsQuery = query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date()))));
        
        const [checkoutsSnap, usersSnap, checkinsSnap] = await Promise.all([
          getDocs(checkoutsQuery),
          getDocs(usersQuery),
          getDocs(checkinsQuery),
        ]);

        if (isMounted) {
          setCheckouts(checkoutsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Checkout[]);
          setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[]);
          setCheckins(checkinsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Checkin[]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [firestore]);


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
