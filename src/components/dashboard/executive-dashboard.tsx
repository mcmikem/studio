"use client"

import type { User, Program, Checkout, ImpactMetric, KeyResult, Activity, Checkin } from "@/lib/types"
import { Alerts } from "./alerts"
import { QuickStatsSummary } from "./quick-stats-summary"
import { ProgramsOverview } from "./programs-overview"
import { ManagementQuickLinks } from "./management-quick-links"
import { DashboardGrid } from "./dashboard-grid"
import { TeamPulse } from "./team-activity-feed"
import { DashboardHeader } from "./dashboard-header"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit, where, Timestamp } from "firebase/firestore"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card"
import { Progress } from "../ui/progress"
import { Badge } from "../ui/badge"
import { ArrowRight, Target, Users, Wand, Globe, TrendingUp, AlertTriangle } from "lucide-react"
import { KeyResultsTracker } from "../plan/key-results-tracker"
import { useMemo } from "react"
import { subDays, startOfWeek, isAfter, subMonths, startOfDay } from "date-fns"
import Link from "next/link"
import { TeamDeployment } from "./team-deployment"

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(value);
};


function EcosystemPulse({ activities }: { activities: Activity[] | null }) {

    const { inspire, empower, sustain } = useMemo(() => {
        if (!activities) {
            return { inspire: 0, empower: 0, sustain: 0 };
        }

        const thirtyDaysAgo = subDays(new Date(), 30);

        const recentActivities = activities.filter(act => {
            if (!act.loggedAt || typeof act.loggedAt.toDate !== 'function') return false;
            return isAfter(act.loggedAt.toDate(), thirtyDaysAgo)
        });

        const inspireCount = recentActivities.filter(a => (a as any).ecosystem_phase === 'Identify & Inspire').length;
        const empowerCount = recentActivities.filter(a => (a as any).ecosystem_phase === 'Equip & Empower').length;
        const sustainRevenue = recentActivities
            .filter(a => (a as any).ecosystem_phase === 'Activate & Sustain')
            .reduce((sum, act) => sum + act.totalValue, 0);

        return { inspire: inspireCount, empower: empowerCount, sustain: sustainRevenue };

    }, [activities]);

    return (
        <Card className="hover:bg-card/90 transition-colors">
            <Link href="/activity-log">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Globe className="h-6 w-6" /> Ecosystem Pulse</CardTitle>
                    <CardDescription>A high-level view of the Omuto Ecosystem's health in the last 30 days.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-semibold">Phase 1: Inspire</p>
                            <p className="text-2xl font-bold">{inspire}</p>
                            <p className="text-xs text-muted-foreground">Active Programs</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-semibold">Phase 2: Empower</p>
                            <p className="text-2xl font-bold">{empower}</p>
                            <p className="text-xs text-muted-foreground">YAP Activities</p>
                        </div>
                         <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-semibold">Phase 3: Sustain</p>
                            <p className="text-2xl font-bold">{formatCurrency(sustain)}</p>
                            <p className="text-xs text-muted-foreground">Value Generated</p>
                        </div>
                    </div>
                </CardContent>
             </Link>
        </Card>
    )
}

function TeamEffectiveness({ activities }: { activities: Activity[] | null}) {
    const { weeklyAvg, costPerImpact } = useMemo(() => {
        if (!activities) {
            return { weeklyAvg: 0, costPerImpact: 0 };
        }

        const fourWeeksAgo = startOfWeek(subDays(new Date(), 3 * 7)); // 3 full weeks ago + this partial week
        const recentActivities = activities.filter(act => 
            act.loggedAt && isAfter(act.loggedAt.toDate(), fourWeeksAgo)
        );

        const weeklyAvg = recentActivities.length / 4;

        const totalCost = activities.reduce((sum, act) => sum + act.actualCost, 0);
        const totalValue = activities.reduce((sum, act) => sum + act.totalValue, 0);
        const costPerImpact = totalValue > 0 ? totalCost / totalValue : 0; 

        return { weeklyAvg, costPerImpact };

    }, [activities]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6" /> Team Effectiveness</CardTitle>
                 <CardDescription>Key organizational performance metrics.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-6">
                 <div>
                    <p className="text-sm text-muted-foreground">Field Efficiency</p>
                    <p className="text-2xl font-bold">{weeklyAvg.toFixed(1)} <span className="text-sm font-normal">activities/wk</span></p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Cost Per Impact</p>
                    <p className="text-2xl font-bold">{costPerImpact.toFixed(2)} <span className="text-sm font-normal">UGX/value</span></p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Productivity</p>
                    <p className="text-2xl font-bold">N/A</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Volunteer Ratio</p>
                    <p className="text-2xl font-bold">N/A</p>
                </div>
            </CardContent>
        </Card>
    )
}


interface DashboardProps {
  profile: User;
}

export function ExecutiveDashboard({ profile }: DashboardProps) {
    const firestore = useFirestore();

    const metricsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'impact-metrics')) : null, [firestore]);
    const { data: metrics } = useCollection<ImpactMetric>(metricsQuery);
    
    // Query for last 60 days of activities for pulse and effectiveness calcs
    const sixtyDaysAgo = subDays(new Date(), 60);
    const activitiesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'activities'), 
            where('loggedAt', '>=', Timestamp.fromDate(sixtyDaysAgo)),
            orderBy('loggedAt', 'desc')
        );
    }, [firestore]);
    const { data: activities } = useCollection<Activity>(activitiesQuery);
    
    const checkoutsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10)) : null, [firestore]);
    const { data: checkouts } = useCollection<Checkout>(checkoutsQuery);
    
    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
    const { data: users } = useCollection<User>(usersQuery);

    const todayStart = startOfDay(new Date());
    const checkinsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(todayStart))) : null, [firestore]);
    const { data: checkins } = useCollection<Checkin>(checkinsQuery);


  return (
    <>
      <QuickStatsSummary metrics={metrics} />

       <DashboardGrid className="mt-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
            <EcosystemPulse activities={activities} />
            <KeyResultsTracker title="October Plan - Strategic Overview" description="Live progress on the October 2025 plan vs. funds and time." />
            <TeamDeployment users={users} checkins={checkins} />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
            <TeamEffectiveness activities={activities} />
            <ManagementQuickLinks />
            <Alerts />
            <TeamPulse checkouts={checkouts} />
        </div>
      </DashboardGrid>
    </>
  )
}
