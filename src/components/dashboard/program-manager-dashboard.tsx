"use client"

import type { User, Program } from "@/lib/types"
import { ProgramsOverview } from "./programs-overview"
import { DailyActions } from "./daily-actions"
import { TeamToday } from "./team-today"
import { Alerts } from "./alerts"
import { DashboardGrid } from "./dashboard-grid"
import { ManagementQuickLinks } from "./management-quick-links"
import { DashboardHeader } from "./dashboard-header"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"

interface DashboardProps {
  profile: User;
}
export function ProgramManagerDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const programsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'programs'), orderBy('deadline')) : null, [firestore]);
  const { data: programs } = useCollection<Program>(programsQuery);
  
  return (
     <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
       <DashboardGrid className="lg:grid-cols-3 mt-0">
        <div className="lg:col-span-2 flex flex-col gap-6">
            <ProgramsOverview programs={programs} />
            <Alerts />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
            <DailyActions />
            <TeamToday />
            <ManagementQuickLinks />
        </div>
      </DashboardGrid>
    </div>
  )
}
