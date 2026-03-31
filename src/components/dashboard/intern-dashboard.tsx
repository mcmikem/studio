'use client';

import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, BarChart3, Users } from 'lucide-react';
import Link from 'next/link';
import { SupervisorCard } from './supervisor-card';
import { DashboardHeader } from './dashboard-header';
import { SmartReminders } from './smart-reminders';
import { MyTasksSummary } from './my-tasks-summary';
import { RoleMissionCard } from './role-mission-card';
import type { DashboardProps } from './dashboard-loader';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, limit, orderBy, where } from 'firebase/firestore';
import { useMemo } from 'react';
import type { Checkout } from '@/lib/types';

const TeamPerformanceLeaderboard = dynamic(() => import('@/components/dashboard/team-performance-leaderboard').then(mod => mod.TeamPerformanceLeaderboard), {
    loading: () => <Skeleton className="h-64" />,
    ssr: false,
});

const EcosystemPulse = dynamic(() => import('./ecosystem-pulse').then(mod => mod.EcosystemPulse), {
    loading: () => <Skeleton className="h-64" />,
    ssr: false,
});

const RecentCheckouts = dynamic(() => import('./recent-checkouts').then(mod => mod.RecentCheckouts), {
    loading: () => <Skeleton className="h-64" />,
    ssr: false,
});

export function InternDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const checkoutsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'checkouts'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
  }, [firestore, user]);

  const { data: checkouts } = useCollection<Checkout>(checkoutsQuery);

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader profile={profile} />
      
      <DashboardGrid className="lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <EcosystemPulse />
                <RecentCheckouts checkouts={checkouts || null} />
           </div>
           <TeamPerformanceLeaderboard />
           <SmartReminders profile={profile} />
        </div>
        
        <div className="flex flex-col gap-8">
           <SupervisorCard profile={profile} />
           <MyTasksSummary />
           <RoleMissionCard profile={profile} />
        </div>
      </DashboardGrid>
    </div>
  );
}
