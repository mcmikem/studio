

"use client"

import type { User, Activity } from "@/lib/types"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore"
import { startOfDay, subDays } from "date-fns"
import { PartnershipPipeline } from "@/components/dashboard/program-manager/partnership-pipeline"
import { QuickInsights } from "@/components/dashboard/program-manager/quick-insights"
import { Skeleton } from "../ui/skeleton"
import dynamic from "next/dynamic"

const DynamicPartnershipPipeline = dynamic(() => import('@/components/dashboard/program-manager/partnership-pipeline').then(mod => mod.PartnershipPipeline), { loading: () => <Skeleton className="h-64" />, ssr: false });
const DynamicQuickInsights = dynamic(() => import('@/components/dashboard/program-manager/quick-insights').then(mod => mod.QuickInsights), { loading: () => <Skeleton className="h-64" />, ssr: false });


interface DashboardProps {
  profile: User;
}
export function ProgramManagerDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();

  const partnershipsQuery = useMemoFirebase((db) => db ? query(collection(db, 'partnerships'), orderBy('createdAt', 'desc')) : null, []);
  const { data: partnerships, isLoading: isLoadingPartnerships } = useCollection(partnershipsQuery);

  
  const activitiesQuery = useMemoFirebase((db) => {
    if (!db) return null;
    const sixWeeksAgo = startOfDay(subDays(new Date(), 42));
    return query(collection(db, 'activities'), where('loggedAt', '>=', Timestamp.fromDate(sixWeeksAgo)), orderBy('loggedAt', 'desc'))
  }, []);

  const { data: activities } = useCollection<Activity>(activitiesQuery, { listen: false });
  

  return (
    <>
     <DashboardGrid className="mt-6">
        <DynamicPartnershipPipeline partnerships={partnerships} isLoading={isLoadingPartnerships} />
        <DynamicQuickInsights activities={activities} />
      </DashboardGrid>
    </>
  )
}
