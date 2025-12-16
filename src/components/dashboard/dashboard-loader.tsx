
'use client';

import dynamic from 'next/dynamic';
import { useViewAs } from '@/hooks/use-view-as';
import type { User, Checkin } from '@/lib/types';
import { DailyActions } from '@/components/dashboard/daily-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, Timestamp, orderBy, limit } from 'firebase/firestore';
import { useMemo } from 'react';
import { startOfDay } from 'date-fns';
import { QuickAddTask } from './quick-add-task';
import { DashboardHeader } from './dashboard-header';

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

const DefaultDashboard = dynamic(() => import('@/components/dashboard/default-dashboard'), { loading: () => <DashboardLoading />, ssr: false });
const ExecutiveDashboard = dynamic(() => import('@/components/dashboard/executive-dashboard').then(mod => mod.ExecutiveDashboard), { loading: () => <DashboardLoading />, ssr: false });
const ProgramManagerDashboard = dynamic(() => import('@/components/dashboard/program-manager-dashboard').then(mod => mod.ProgramManagerDashboard), { loading: () => <DashboardLoading />, ssr: false });
const FieldStaffDashboard = dynamic(() => import('@/components/dashboard/field-staff-dashboard').then(mod => mod.FieldStaffDashboard), { loading: () => <DashboardLoading />, ssr: false });
const MediaFinanceDashboard = dynamic(() => import('@/components/dashboard/media-finance-dashboard').then(mod => mod.MediaFinanceDashboard), { loading: () => <DashboardLoading />, ssr: false });
const InternVolunteerDashboard = dynamic(() => import('@/components/dashboard/intern-volunteer-dashboard').then(mod => mod.InternVolunteerDashboard), { loading: () => <DashboardLoading />, ssr: false });

const roleToDashboard: { [key: string]: React.FC<any> } = {
  'Administrator': ExecutiveDashboard,
  'Executive Director': ExecutiveDashboard,
  'Programs & Partnerships Manager': ProgramManagerDashboard,
  'Operations & Field Manager': ProgramManagerDashboard,
  'Field Coordinator': FieldStaffDashboard,
  'Media & Communications Lead': MediaFinanceDashboard,
  'Media & Finance Lead': MediaFinanceDashboard,
  'Resource Mobilization Lead': ProgramManagerDashboard,
  'Intern': InternVolunteerDashboard,
  'Volunteer': InternVolunteerDashboard,
  'default': DefaultDashboard,
};

interface DashboardLoaderProps {
  profile: User;
}

export function DashboardLoader({ profile }: DashboardLoaderProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { viewAsRole } = useViewAs();

  const effectiveRole = viewAsRole || profile?.role;
  const hydratedProfile = viewAsRole ? ({ ...profile, role: viewAsRole } as User) : profile;

  const latestCheckinQuery = useMemo(() => {
    if (!user || !firestore) return null;
    const todayStart = startOfDay(new Date());
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

  const DashboardComponent = roleToDashboard[effectiveRole as string] || roleToDashboard['default'];

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      <QuickAddTask />
      <DailyActions checkin={latestCheckin} isLoadingCheckin={isLoadingUserCheckin} />
      <DashboardComponent profile={hydratedProfile} />
    </div>
  );
}
