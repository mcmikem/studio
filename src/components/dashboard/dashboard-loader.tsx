
'use client';

import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import type { User as UserProfileType, User, Checkin, Checkout } from '@/lib/types';
import { DefaultDashboard } from './default-dashboard';
import { useFirestore } from '@/firebase';
import { getDocs, collection, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { startOfDay } from 'date-fns';


// Define the shape of the dashboard props
export interface DashboardProps {
  profile: UserProfileType;
}

// Dynamically import all dashboard components
const AdminDashboard = dynamic(() => import('./admin-dashboard').then(mod => mod.AdminDashboard), { loading: () => <DashboardSkeleton /> });
const ExecutiveDashboard = dynamic(() => import('./executive-dashboard').then(mod => mod.ExecutiveDashboard), { loading: () => <DashboardSkeleton /> });
const ProgramManagerDashboard = dynamic(() => import('./program-manager-dashboard').then(mod => mod.ProgramManagerDashboard), { loading: () => <DashboardSkeleton /> });
const FieldStaffDashboard = dynamic(() => import('./field-staff-dashboard').then(mod => mod.FieldStaffDashboard), { loading: () => <DashboardSkeleton /> });
const InternVolunteerDashboard = dynamic(() => import('./intern-volunteer-dashboard').then(mod => mod.InternVolunteerDashboard), { loading: () => <DashboardSkeleton /> });
const MediaFinanceDashboard = dynamic(() => import('./media-finance-dashboard').then(mod => mod.MediaFinanceDashboard), { loading: () => <DashboardSkeleton /> });

const dashboardMap: Record<string, React.ComponentType<DashboardProps>> = {
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

const DashboardSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-32" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="h-[400px] md:col-span-4" />
          <Skeleton className="h-[400px] md:col-span-3" />
        </div>
      </div>
)

export function DashboardLoader({ profile }: { profile: UserProfileType | null }) {
  const firestore = useFirestore();
  const [defaultDashboardData, setDefaultDashboardData] = useState<{
    users: User[] | null;
    checkins: Checkin[] | null;
    checkouts: Checkout[] | null;
    isLoading: boolean;
  }>({ users: null, checkins: null, checkouts: null, isLoading: true });

  useEffect(() => {
    // Only fetch data if we're going to render the DefaultDashboard
    if (profile) {
      setDefaultDashboardData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    let isMounted = true;
    
    async function fetchDefaultData() {
      if (!firestore) {
        if(isMounted) setDefaultDashboardData({ users: null, checkins: null, checkouts: null, isLoading: false });
        return;
      }
      
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
          setDefaultDashboardData({
            checkouts: checkoutsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Checkout[],
            users: usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[],
            checkins: checkinsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Checkin[],
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Error fetching default dashboard data:", error);
         if (isMounted) {
            setDefaultDashboardData({ users: null, checkins: null, checkouts: null, isLoading: false });
         }
      }
    }
    
    fetchDefaultData();

    return () => {
      isMounted = false;
    };
  }, [profile, firestore]);

  if (!profile) {
    if (defaultDashboardData.isLoading) {
      return <DashboardSkeleton />;
    }
    return <DefaultDashboard {...defaultDashboardData} />;
  }

  const DashboardComponent = dashboardMap[profile.role] || DefaultDashboard;

  return <DashboardComponent profile={profile} />;
}
