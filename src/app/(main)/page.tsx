
'use client';

import { useUser, useFirestore, useCollection } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { useViewAs } from '@/hooks/use-view-as';
import type { User, Checkin } from '@/lib/types';
import { collection, query, where, Timestamp, orderBy, limit } from 'firebase/firestore';
import { useMemo } from 'react';
import { DailyActions } from '@/components/dashboard/daily-actions';
import { QuickAddTask } from '@/components/dashboard/quick-add-task';
import { SmartReminders } from '@/components/dashboard/smart-reminders';
import { RoleSpecificKpis } from '@/components/dashboard/role-kpis';
import { UserPerformance } from '@/components/profile/user-performance';


// Define a loading component for dynamic imports
const DashboardLoading = () => (
  <div className="space-y-6 mt-6">
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
             <Skeleton className="h-48" />
             <Skeleton className="h-96" />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
            <Skeleton className="h-64" />
        </div>
    </div>
  </div>
);


// Dynamically import each dashboard component
const DefaultDashboard = dynamic(() => import('@/components/dashboard/default-dashboard').then(mod => mod.DefaultDashboard), { loading: () => <DashboardLoading /> });
const ExecutiveDashboard = dynamic(() => import('@/components/dashboard/executive-dashboard').then(mod => mod.ExecutiveDashboard), { loading: () => <DashboardLoading /> });
const ProgramManagerDashboard = dynamic(() => import('@/components/dashboard/program-manager-dashboard').then(mod => mod.ProgramManagerDashboard), { loading: () => <DashboardLoading /> });
const FieldStaffDashboard = dynamic(() => import('@/components/dashboard/field-staff-dashboard').then(mod => mod.FieldStaffDashboard), { loading: () => <DashboardLoading /> });
const MediaFinanceDashboard = dynamic(() => import('@/components/dashboard/media-finance-dashboard').then(mod => mod.MediaFinanceDashboard), { loading: () => <DashboardLoading /> });
const InternVolunteerDashboard = dynamic(() => import('@/components/dashboard/intern-volunteer-dashboard').then(mod => mod.InternVolunteerDashboard), { loading: () => <DashboardLoading /> });


const roleToDashboard: { [key: string]: { component: React.FC<any>, title: string } } = {
  'Administrator': { component: ExecutiveDashboard, title: 'Administrator Dashboard' },
  'Executive Director': { component: ExecutiveDashboard, title: 'Executive Dashboard' },
  'Programs & Partnerships Manager': { component: ProgramManagerDashboard, title: 'Program Dashboard' },
  'Operations & Field Manager': { component: ProgramManagerDashboard, title: 'Operations Dashboard' }, // Using Program Manager for now
  'Field Coordinator': { component: FieldStaffDashboard, title: 'Field Operations' },
  'Media & Communications Lead': { component: MediaFinanceDashboard, title: 'Media & Finance Hub' },
  'Media & Finance Lead': { component: MediaFinanceDashboard, title: 'Media & Finance Hub' },
  'Resource Mobilization Lead': { component: ProgramManagerDashboard, title: 'Resource Mobilization' }, // Using Program Manager for now
  'Intern': { component: InternVolunteerDashboard, title: 'Intern Hub'},
  'Volunteer': { component: InternVolunteerDashboard, title: 'Volunteer Hub'},
  'default': { component: DefaultDashboard, title: 'Welcome to Omuto Central' },
};


export default function DashboardPage() {
  const { user } = useUser();
  const { profile: realProfile, isLoading: isLoadingProfile } = useUserProfile(user);
  const { viewAsRole } = useViewAs();
  const firestore = useFirestore();

  const effectiveRole = viewAsRole || realProfile?.role;
  const profile = viewAsRole ? ({ ...realProfile, role: viewAsRole } as User) : realProfile;

  const latestCheckinQuery = useMemo(() => {
    if (!user || !firestore) return null;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return query(
      collection(firestore, 'checkins'),
      where('userId', '==', user.uid),
      where('timestamp', '>=', Timestamp.fromDate(todayStart)),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [user, firestore]);

  const { data: userCheckins, isLoading: isLoadingUserCheckin } = useCollection<Checkin>(latestCheckinQuery);

  const latestCheckin = useMemo(() => {
    if (!userCheckins || userCheckins.length === 0) return null;
    return userCheckins[0];
  }, [userCheckins]);

  if (isLoadingProfile || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!profile) {
     return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4">Finalizing account setup...</p>
      </div>
    );
  }

  const { component: DashboardComponent, title: dashboardTitle } = roleToDashboard[effectiveRole as string] || roleToDashboard['default'];
  
  return (
    <div className="flex flex-col gap-6">
        <DashboardHeader profile={profile} title={dashboardTitle} />

        <QuickAddTask />
        
        <DailyActions checkin={latestCheckin} isLoadingCheckin={isLoadingUserCheckin} />
        
        <SmartReminders profile={profile} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
                <DashboardComponent profile={profile} />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-6">
                 <RoleSpecificKpis role={profile.role} />
                 <UserPerformance userId={user.uid} />
            </div>
        </div>
    </div>
  );
}
