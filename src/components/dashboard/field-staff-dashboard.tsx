
'use client';

import type { User, Checkout, Checkin } from '@/lib/types';
import { TeamPulse } from './team-activity-feed';
import { MyWeeklyPlan } from './my-weekly-plan';
import { DashboardGrid } from './dashboard-grid';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { DashboardCalendar } from './dashboard-calendar';
import { TeamDeployment } from './team-deployment';
import { startOfDay } from 'date-fns';
import { useMemo } from 'react';
import { KeyResultsTracker } from '../plan/key-results-tracker';

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

  const checkinsQuery = useMemo(() => firestore ? query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date())))) : null, [firestore]);
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
