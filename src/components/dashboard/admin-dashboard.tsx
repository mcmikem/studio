
"use client"

import type { User as UserProfileType } from "@/lib/types"
import { ManagementQuickLinks } from "@/components/dashboard/management-quick-links"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import type { DashboardProps } from "./dashboard-loader"
import { DashboardHeader } from "./dashboard-header"
import { RoleMissionCard } from "./role-mission-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, limit, orderBy } from "firebase/firestore"
import { useMemo } from "react"
import { Users, DollarSign, Target, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export function AdminDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  
  const expensesQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc'), limit(10)) : null
  , [firestore]);
  const { data: expenses, isLoading: expensesLoading } = useCollection(expensesQuery);

  const pendingCount = expenses?.filter(e => e.status === 'Pending').length || 0;

  return (
    <div className="flex flex-col gap-8">
        <DashboardHeader profile={profile} />
        <DashboardGrid className="mt-2 lg:grid-cols-3">
            <div className="lg:col-span-1 flex flex-col gap-8">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-bold text-omuto-navy mb-4 flex items-center gap-2">
                            <Users className="h-4 w-4" /> Team Activity
                        </h3>
                        <p className="text-sm text-muted-foreground">Team performance leaderboard</p>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 flex flex-col gap-8">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-bold text-omuto-navy mb-4 flex items-center gap-2">
                            <Target className="h-4 w-4" /> Deployments
                        </h3>
                        <p className="text-sm text-muted-foreground">Team deployment tracking</p>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 flex flex-col gap-8">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-bold text-omuto-navy mb-4 flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Pending
                        </h3>
                        {expensesLoading ? <Skeleton className="h-8" /> : (
                            <p className="text-2xl font-black text-omuto-navy">{pendingCount}</p>
                        )}
                    </CardContent>
                </Card>
                <ManagementQuickLinks />
            </div>
        </DashboardGrid>
        <RoleMissionCard profile={profile} />
    </div>
  )
}
