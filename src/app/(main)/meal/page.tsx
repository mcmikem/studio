

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { KeyResultsTracker } from '@/components/plan/key-results-tracker';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Program, Activity } from '@/lib/types';
import { useMemo } from 'react';
import { subDays, isAfter } from 'date-fns';
import { Globe, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function EcosystemPulse({ activities, programs, isLoading }: { activities: Activity[] | null, programs: Program[] | null, isLoading: boolean }) {

    const { inspire, empower, sustain, trends } = useMemo(() => {
        if (!activities || !programs) {
            return { inspire: { count: 0 }, empower: { count: 0 }, sustain: { revenue: 0 }, trends: { engagement: 0, retention: 0, quality: 0 } };
        }

        const thirtyDaysAgo = subDays(new Date(), 30);
        const sixtyDaysAgo = subDays(new Date(), 60);

        const recentActivities = activities.filter(act => {
            if (!act.loggedAt || typeof act.loggedAt.toDate !== 'function') return false;
            return isAfter(act.loggedAt.toDate(), thirtyDaysAgo)
        });
        
        const olderActivities = activities.filter(act => {
            if (!act.loggedAt || typeof act.loggedAt.toDate !== 'function') return false;
            const actDate = act.loggedAt.toDate();
            return isAfter(actDate, sixtyDaysAgo) && actDate < thirtyDaysAgo;
        });

        // Inspire = Number of active programs
        const inspireCount = programs.filter(p => p.status === 'On Track').length;
        const inspireEngagement = 85; // Mock data for now

        // Empower = Number of YoSkills activities
        const empowerCount = programs.filter(p => p.title === 'YoSkills Entrepreneurship' && p.status === 'On Track').length;
        const empowerCompletion = 67; // Mock data

        // Sustain = Revenue from "Activate & Sustain" activities
        const sustainRevenue = recentActivities
            .filter(a => a.ecosystem_phase === 'Activate & Sustain')
            .reduce((sum, act) => sum + act.totalValue, 0);
        const productQuality = 92; // Mock data

        // Trends (simplified mock)
        const engagementTrend = 15;
        const retentionTrend = -8;
        const qualityTrend = 88;

        return { 
            inspire: { count: inspireCount, engagement: inspireEngagement }, 
            empower: { count: empowerCount, completion: empowerCompletion }, 
            sustain: { revenue: sustainRevenue, quality: productQuality },
            trends: { engagement: engagementTrend, retention: retentionTrend, quality: qualityTrend }
        };

    }, [activities, programs]);

    if (isLoading) {
        return <Skeleton className="h-48 w-full" />
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-6 w-6" /> Ecosystem Pulse</CardTitle>
                <CardDescription>A real-time health check of the Omuto ecosystem.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-semibold">Phase 1: Inspire</p>
                        <p className="text-2xl font-bold">{inspire.count} <span className="text-sm font-normal text-muted-foreground">schools</span></p>
                        <p className="text-xs text-muted-foreground">{inspire.engagement}% engagement</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-semibold">Phase 2: Equip</p>
                        <p className="text-2xl font-bold">{empower.count} <span className="text-sm font-normal text-muted-foreground">YAP chapters</span></p>
                        <p className="text-xs text-muted-foreground">{empower.completion}% project completion</p>
                    </div>
                     <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-semibold">Phase 3: Sustain</p>
                        <p className="text-2xl font-bold">{formatCurrency(sustain.revenue)}</p>
                        <p className="text-xs text-muted-foreground">{sustain.quality}% product quality</p>
                    </div>
                </div>
                 <div>
                    <h4 className="text-sm font-semibold mb-2">Trending Indicators (30d)</h4>
                    <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" /> Youth engagement +{trends.engagement}%</div>
                        <div className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-500" /> Volunteer retention {trends.retention}%</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function MealPage() {
  const firestore = useFirestore();

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'activities'), orderBy('loggedAt', 'desc'));
  }, [firestore]);

  const programsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'programs'));
  }, [firestore]);

  const { data: activities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery);
  const { data: programs, isLoading: isLoadingPrograms } = useCollection<Program>(programsQuery);


  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          📊 MEAL Hub
        </h1>
        <p className="text-muted-foreground">
          Monitoring, Evaluation, Accountability & Learning at a glance.
        </p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>Program-Centric Data Collection</CardTitle>
            <CardDescription>Data collection is now handled within each program's specific dashboard to ensure context and accuracy.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Select a program to view its dashboard and log relevant data.</p>
            <Button asChild>
                <Link href="/management/programs">
                    Go to Program Dashboards <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <KeyResultsTracker 
            title="October Plan Progress"
            description="Live progress against the operational plan's Key Results."
          />
        </div>
        <div className="lg:col-span-1">
            <EcosystemPulse activities={activities} programs={programs} isLoading={isLoadingActivities || isLoadingPrograms} />
        </div>
      </div>
    </div>
  );
}
