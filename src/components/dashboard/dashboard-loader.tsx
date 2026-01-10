
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { User as UserProfileType, Activity, Checkin, Program, Checkout, ImpactMetric, Partnership } from '@/lib/types';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp, limit, getDocs } from 'firebase/firestore';
import { subDays, startOfDay } from 'date-fns';
import { DefaultDashboard } from './default-dashboard';
import { DashboardSkeleton } from './dashboard-skeleton';

export interface DashboardProps {
  profile: UserProfileType;
}

export interface DashboardData {
    activities: Activity[] | null;
    users: UserProfileType[] | null;
    checkins: Checkin[] | null;
    programs: Program[] | null;
    metrics: ImpactMetric[] | null;
    checkouts: Checkout[] | null;
    partnerships: Partnership[] | null;
    allExpenses: Expense[] | null;
    allIncome: Income[] | null;
    testimonies: Testimony[] | null;
}

const AdminDashboard = dynamic(() => import('./admin-dashboard').then(mod => mod.AdminDashboard), { loading: () => <DashboardSkeleton />, ssr: false });
const ExecutiveDashboard = dynamic(() => import('./executive-dashboard').then(mod => mod.ExecutiveDashboard), { loading: () => <DashboardSkeleton />, ssr: false });
const ProgramManagerDashboard = dynamic(() => import('./program-manager-dashboard').then(mod => mod.ProgramManagerDashboard), { loading: () => <DashboardSkeleton />, ssr: false });
const FieldStaffDashboard = dynamic(() => import('./field-staff-dashboard').then(mod => mod.FieldStaffDashboard), { loading: () => <DashboardSkeleton />, ssr: false });
const InternVolunteerDashboard = dynamic(() => import('./intern-volunteer-dashboard').then(mod => mod.InternVolunteerDashboard), { loading: () => <DashboardSkeleton />, ssr: false });
const MediaFinanceDashboard = dynamic(() => import('./media-finance-dashboard').then(mod => mod.MediaFinanceDashboard), { loading: () => <DashboardSkeleton />, ssr: false });

const dashboardMap: Record<string, React.ComponentType<{ profile: UserProfileType; data: DashboardData; isLoading: boolean; }>> = {
  'Administrator': AdminDashboard,
  'Executive Director': ExecutiveDashboard,
  'Programs & Partnerships Manager': ProgramManagerDashboard,
  'Operations & Field Manager': FieldStaffDashboard,
  'Media & Communications Lead': MediaFinanceDashboard,
  'Media & Finance Lead': MediaFinanceDashboard,
  'Field Coordinator': FieldStaffDashboard,
  'Intern': InternVolunteerDashboard,
  'Volunteer': InternVolunteerDashboard,
};

export function DashboardLoader({ profile }: { profile: UserProfileType | null }) {
  const firestore = useFirestore();
  const [data, setData] = useState<DashboardData>({
    activities: null, users: null, checkins: null, programs: null, 
    checkouts: null, metrics: null, partnerships: null, allExpenses: null, 
    allIncome: null, testimonies: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const thirtyDaysAgo = subDays(new Date(), 30);
            const todayStart = startOfDay(new Date());

            const queries = {
                activities: query(collection(firestore, 'activities'), where('loggedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)), orderBy('loggedAt', 'desc')),
                users: query(collection(firestore, 'users'), orderBy('name')),
                checkins: query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(todayStart))),
                programs: query(collection(firestore, 'programs')),
                checkouts: query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(5)),
                metrics: query(collection(firestore, 'impact-metrics'), orderBy('metric')),
                partnerships: query(collection(firestore, 'partnerships'), orderBy('createdAt', 'desc')),
                allExpenses: query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')),
                allIncome: query(collection(firestore, 'income'), orderBy('createdAt', 'desc')),
                testimonies: query(collection(firestore, 'testimonies'), orderBy('createdAt', 'desc'), limit(5)),
            };

            const [
                activitiesSnap, usersSnap, checkinsSnap, programsSnap, checkoutsSnap, 
                metricsSnap, partnershipsSnap, expensesSnap, incomeSnap, testimoniesSnap
            ] = await Promise.all(Object.values(queries).map(q => getDocs(q)));

            setData({
                activities: activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity)),
                users: usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfileType)),
                checkins: checkinsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Checkin)),
                programs: programsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program)),
                checkouts: checkoutsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Checkout)),
                metrics: metricsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ImpactMetric)),
                partnerships: partnershipsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Partnership)),
                allExpenses: expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)),
                allIncome: incomeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Income)),
                testimonies: testimoniesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimony)),
            });

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();
  }, [firestore]);


  if (!profile) {
    return <DefaultDashboard data={data} isLoading={isLoading} />;
  }
  
  const DashboardComponent = dashboardMap[profile.role] || DefaultDashboard;

  if (isLoading) {
      return <DashboardSkeleton />;
  }

  return <DashboardComponent profile={profile} data={data} isLoading={isLoading} />;
}
