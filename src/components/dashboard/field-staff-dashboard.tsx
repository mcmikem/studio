
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

  return (
    <>
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
