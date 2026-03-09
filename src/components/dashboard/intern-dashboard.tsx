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
import type { DashboardProps } from './dashboard-loader';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
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
  
  const checkoutsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10));
  }, [firestore]);

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
           <Card className="bg-omuto-blue/10 border-omuto-blue/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-black italic uppercase text-sm tracking-tighter"><BarChart3 className="h-4 w-4" /> Intern Advancement</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">Your track at Omuto Foundation</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-xs font-medium leading-relaxed mb-4">
                        As an intern, you have access to the **Ecosystem Pulse** and **Recent Checkouts** to understand how the entire team is operating in the field.
                    </p>
                    <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest h-10 border-2" asChild>
                        <Link href="/management">Explore Management Tools</Link>
                    </Button>
                </CardContent>
           </Card>
        </div>
      </DashboardGrid>
    </div>
  );
}
