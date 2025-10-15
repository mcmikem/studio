
'use client';

import type { User, Checkout, Checkin } from '@/lib/types';
import { DailyActions } from './daily-actions';
import { TeamPulse } from './team-activity-feed';
import { MyWeeklyPlan } from './my-weekly-plan';
import { DashboardGrid } from './dashboard-grid';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Camera, Receipt, Target } from 'lucide-react';
import Link from 'next/link';
import { SmartReminders } from './smart-reminders';
import { Loader2 } from 'lucide-react';
import { DashboardCalendar } from './dashboard-calendar';
import { QuickAddTask } from './quick-add-task';
import { useMemo } from 'react';
import { startOfDay } from 'date-fns';
import { TodaysFocus } from './todays-focus';


interface DashboardProps {
  profile: User;
}

export function FieldStaffDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const checkoutsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10))
        : null,
    [firestore]
  );
  const { data: checkouts } = useCollection<Checkout>(checkoutsQuery);

  const latestCheckinQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    return query(
      collection(firestore, 'checkins'),
      where('userId', '==', user.uid),
      where('timestamp', '>=', todayTimestamp)
    );
  }, [user, firestore]);

  const { data: checkins, isLoading: isLoadingUserCheckin } = useCollection<Checkin>(latestCheckinQuery);
  const latestCheckin = useMemo(() => {
    if (!checkins || checkins.length === 0) return null;
    return checkins.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())[0];
  }, [checkins]);

  return (
    <>
        {latestCheckin && <TodaysFocus checkin={latestCheckin} isLoading={isLoadingUserCheckin} />}
        <DashboardGrid className="mt-6 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
                <DailyActions />
                <SmartReminders profile={profile} />
                <TeamPulse checkouts={checkouts} />
            </div>
            <div className="flex flex-col gap-6">
                <QuickAddTask />
                <DashboardCalendar />
                <MyWeeklyPlan />
            </div>
        </DashboardGrid>
    </>
  );
}
