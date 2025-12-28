
'use client';

import type { User, Checkin } from '@/lib/types';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MessageCircle, Sparkles, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { startOfDay } from 'date-fns';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';
import { SupervisorCard } from './supervisor-card';

const TeamDeployment = dynamic(() => import('./team-deployment').then(mod => mod.TeamDeployment), { loading: () => <Skeleton className="h-64" />, ssr: false });

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

function FirstQuestCard() {
    return (
        <Card className="bg-primary/10 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles /> Your First Quest!</CardTitle>
                <CardDescription>Get to know Omuto better by using your AI Coach.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="font-semibold mb-2">Your Mission:</p>
                <p className="mb-4">Go to the AI Coach and ask: <span className="italic font-medium">"What are the main programs at Omuto Foundation?"</span></p>
                <Button asChild>
                    <Link href="/chat">
                        Start Your Quest
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
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
    return query(collection(db, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfDay(new Date()))))
  }, [firestore]);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);

  return (
    <DashboardGrid className="mt-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
            <QuickActionsCard />
            <SupervisorCard profile={profile} />
        </div>
         <div className="flex flex-col gap-6">
            <FirstQuestCard />
            <TeamDeployment users={users} checkins={checkins} isLoading={isLoadingUsers || isLoadingCheckins} />
         </div>
    </DashboardGrid>
  );
}
