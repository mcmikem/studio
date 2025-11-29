
'use client';

import type { User, Checkin } from '@/lib/types';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { startOfDay } from 'date-fns';
import { TeamDeployment } from './team-deployment';

function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Daily Tasks</CardTitle>
        <CardDescription>Log your work and share your progress with the team.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button size="lg" asChild>
          <Link href="/forms/check-out">
            <MessageCircle className="mr-2 h-4 w-4" /> Submit End-of-Day Note
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

interface DashboardProps {
  profile: User;
}

export function InternVolunteerDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);
  const checkinsQuery = useMemoFirebase((db) => {
    if(!firestore) return null;
    return query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date()))))
  }, [firestore]);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);

  return (
    <DashboardGrid className="mt-6">
        <QuickActionsCard />
        <TeamDeployment users={users} checkins={checkins} isLoading={isLoadingUsers || isLoadingCheckins} />
        <Card className="min-h-96">
          <CardHeader>
            <CardTitle>My Tasks &amp; Impact</CardTitle>
            <CardDescription>
              Coming Soon: A view of your assigned tasks and the impact you're
              making.
            </CardDescription>
          </CardHeader>
        </Card>
    </DashboardGrid>
  );
}
