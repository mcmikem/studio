"use client"

import type { User, Program, Checkout, ImpactMetric, KeyResult } from "@/lib/types"
import { Alerts } from "./alerts"
import { QuickStatsSummary } from "./quick-stats-summary"
import { ProgramsOverview } from "./programs-overview"
import { TeamToday } from "./team-today"
import { ManagementQuickLinks } from "./management-quick-links"
import { DashboardGrid } from "./dashboard-grid"
import { TeamPulse } from "./team-activity-feed"
import { DashboardHeader } from "./dashboard-header"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card"
import { Progress } from "../ui/progress"
import { Badge } from "../ui/badge"
import { ArrowRight, Target, Users, Wand } from "lucide-react"
import { KeyResultsTracker } from "../plan/key-results-tracker"

function EcosystemPulse() {
    // NOTE: Data is mocked for now. In a real app, this would be derived from complex queries.
    const ecosystemHealth = {
        inspire: { schools: 8, youth: 245 },
        empower: { chapters: 6, projects: 12 },
        sustain: { revenue: 120000, grads: 8 }
    };
    const trending = "+15%";

    return (
        <Card>
            <CardHeader>
                <CardTitle>🌍 Ecosystem Pulse</CardTitle>
                <CardDescription>A high-level view of the Omuto Ecosystem's health.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-semibold">Phase 1: Inspire</p>
                        <p className="text-2xl font-bold">{ecosystemHealth.inspire.youth}</p>
                        <p className="text-xs text-muted-foreground">{ecosystemHealth.inspire.schools} schools active</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-semibold">Phase 2: Empower</p>
                        <p className="text-2xl font-bold">{ecosystemHealth.empower.projects}</p>
                        <p className="text-xs text-muted-foreground">{ecosystemHealth.empower.chapters} YAP chapters</p>
                    </div>
                     <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-semibold">Phase 3: Sustain</p>
                        <p className="text-2xl font-bold">{(ecosystemHealth.sustain.revenue/1000).toFixed(0)}k</p>
                        <p className="text-xs text-muted-foreground">UGX Revenue</p>
                    </div>
                </div>
                 <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground">Youth Engagement Trend</p>
                    <p className="text-lg font-bold text-green-500">↗︎ {trending} this month</p>
                 </div>
            </CardContent>
        </Card>
    )
}

function TeamEffectiveness() {
    // NOTE: Data is mocked.
    return (
        <Card>
            <CardHeader>
                <CardTitle>📊 Team Effectiveness</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">Productivity</p>
                    <p className="text-2xl font-bold">87% <span className="text-green-500 text-sm">(↑5%)</span></p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Field Efficiency</p>
                    <p className="text-2xl font-bold">45 <span className="text-sm font-normal">activities/week</span></p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Cost Per Impact</p>
                    <p className="text-2xl font-bold">15,000 <span className="text-sm font-normal">UGX/person</span></p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Volunteer Ratio</p>
                    <p className="text-2xl font-bold">1:3 <span className="text-sm font-normal">(staff:vol)</span></p>
                </div>
                 <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Top Performers</p>
                    <p className="font-semibold">Bwire (18 activities), Dianah (6 partnerships)</p>
                </div>
            </CardContent>
        </Card>
    )
}

function CriticalDecisions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>🎯 Attention Needed</CardTitle>
                <CardDescription>Key strategic decisions based on current data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <Target className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Partnerships Behind Schedule</p>
                        <p className="text-sm text-muted-foreground">KR4 is at 50% with the deadline approaching. Consider reallocating resources to support the resource mobilization team.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                     <Users className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Volunteer Capacity at 85%</p>
                        <p className="text-sm text-muted-foreground">Upcoming events may strain our volunteer pool. Should we start a recruitment drive or consider temporary hires?</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Wand className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Confirm Girl Child Day Prep</p>
                        <p className="text-sm text-muted-foreground">The event is in 3 days. Final confirmation with all stakeholders is recommended.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


interface DashboardProps {
  profile: User;
}

export function ExecutiveDashboard({ profile }: DashboardProps) {

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />

       <div className="mt-6">
          <QuickStatsSummary metrics={null} />
      </div>

       <DashboardGrid className="lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
            <EcosystemPulse />
            <KeyResultsTracker />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
            <TeamEffectiveness />
            <CriticalDecisions />
            <ManagementQuickLinks />
        </div>
      </DashboardGrid>
    </div>
  )
}
