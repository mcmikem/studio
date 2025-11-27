'use client';

import type { User, Checkout, Checkin } from '@/lib/types';
import { TeamPulse } from '@/components/dashboard/team-activity-feed';
import { MyWeeklyPlan } from '@/components/dashboard/my-weekly-plan';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { DashboardCalendar } from '@/components/dashboard/dashboard-calendar';
import { TeamDeployment } from '@/components/dashboard/team-deployment';
import { startOfDay } from 'date-fns';
import { useMemo } from 'react';
import { KeyResultsTracker } from '@/components/plan/key-results-tracker';

interface DashboardProps {
  profile: User;
}

export function FieldStaffDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const checkoutsQuery = useMemo(
    () =>
      firestore
        ? query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10))
        : null,
    [firestore]
  );
  const { data: checkouts } = useCollection<Checkout>(checkoutsQuery);

  const usersQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const checkinsQuery = useMemoFirebase((db) => {
    if(!firestore) return null;
    return query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date()))))
  }, [firestore]);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);

  return (
    <>
        <DashboardGrid className="mt-6">
            <MyWeeklyPlan />
            <DashboardCalendar />
            <TeamDeployment users={users} checkins={checkins} isLoading={isLoadingUsers || isLoadingCheckins} />
            <TeamPulse checkouts={checkouts} />
        </DashboardGrid>
    </>
  );
}
