
'use client';

import type { User, Checkout, Checkin } from '@/lib/types';
import { DailyActions } from './daily-actions';
import { TeamPulse } from './team-activity-feed';
import { MyWeeklyPlan } from './my-weekly-plan';
import { DashboardGrid } from './dashboard-grid';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Camera, Receipt, Target } from 'lucide-react';
import Link from 'next/link';
import { SmartReminders } from './smart-reminders';
import { Loader2 } from 'lucide-react';
import { DashboardCalendar } from './dashboard-calendar';
import { QuickAddTask } from './quick-add-task';


function TodaysBattlePlan() {
  const { user } = useUser();
  const firestore = useFirestore();

  const latestCheckinQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'checkins'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [user, firestore]);

  const { data: checkins, isLoading } = useCollection<Checkin>(latestCheckinQuery);
  const latestCheckin = checkins?.[0];

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="text-primary" />
          Today's Battle Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-6 w-3/4 bg-muted-foreground/20 animate-pulse rounded-md" />
            <div className="h-4 w-1/2 bg-muted-foreground/20 animate-pulse rounded-md" />
          </div>
        ) : latestCheckin ? (
          <div>
            <h3 className="text-xl font-bold">
              🎯 Daily Mission: {latestCheckin.primaryMission}
            </h3>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No check-in found for today.</p>
            <Button asChild variant="link">
              <Link href="/daily-plan">Check in now to set your mission!</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardProps {
  profile: User;
}

export function FieldStaffDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const checkoutsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10))
        : null,
    [firestore]
  );
  const { data: checkouts } = useCollection<Checkout>(checkoutsQuery);

  return (
    <DashboardGrid className="mt-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
            <TodaysBattlePlan />
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
  );
}
