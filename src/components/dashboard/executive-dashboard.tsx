"use client"

import type { User, Program, Checkout, ImpactMetric } from "@/lib/types"
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

interface DashboardProps {
  profile: User;
}

export function ExecutiveDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();

  const programsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'programs'), orderBy('deadline')) : null, [firestore]);
  const { data: programs } = useCollection<Program>(programsQuery);

  const checkoutsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'), limit(10)) : null, [firestore]);
  const { data: checkouts } = useCollection<Checkout>(checkoutsQuery);

  const metricsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'impact-metrics')) : null, [firestore]);
  const { data: metrics } = useCollection<ImpactMetric>(metricsQuery);

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />

       <div className="col-span-full mt-6">
          <QuickStatsSummary metrics={metrics} />
      </div>

       <DashboardGrid className="lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
            <ProgramsOverview programs={programs} />
            <TeamPulse checkouts={checkouts} />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
            <TeamToday />
            <Alerts />
            <ManagementQuickLinks />
        </div>
      </DashboardGrid>
    </div>
  )
}
