
"use client"

import type { User as UserProfileType } from "@/lib/types"
import { ManagementQuickLinks } from "@/components/dashboard/management-quick-links"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import dynamic from 'next/dynamic'
import type { DashboardProps } from "./dashboard-loader"
import { Skeleton } from "../ui/skeleton";
import { DashboardHeader } from "./dashboard-header"
import { RoleMissionCard } from "./role-mission-card"

import { useFirestore, useCollection } from "@/firebase"
import { collection, query, limit, orderBy } from "firebase/firestore"
import { useMemo } from "react"
import type { Checkout } from "@/lib/types"

const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), { loading: () => <Skeleton className="h-64 rounded-2xl" />, ssr: false });
const DashboardCalendar = dynamic(() => import('@/components/dashboard/dashboard-calendar').then(mod => mod.DashboardCalendar), { loading: () => <Skeleton className="h-64 rounded-2xl" />, ssr: false });
const PartnershipPipeline = dynamic(() => import('@/components/dashboard/program-manager/partnership-pipeline').then(mod => mod.PartnershipPipeline), { loading: () => <Skeleton className="h-64 rounded-2xl" />, ssr: false });
const TeamPerformanceLeaderboard = dynamic(() => import('@/components/dashboard/team-performance-leaderboard').then(mod => mod.TeamPerformanceLeaderboard), { loading: () => <Skeleton className="h-96 rounded-2xl" />, ssr: false });

export function AdminDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-8">
        <DashboardHeader profile={profile} />
        <DashboardGrid className="mt-2 lg:grid-cols-3">
            <div className="lg:col-span-1 flex flex-col gap-8">
                 <TeamPerformanceLeaderboard />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-8">
                <TeamDeployment />
                <PartnershipPipeline />
            </div>
             <div className="lg:col-span-1 flex flex-col gap-8">
                <DashboardCalendar />
                <ManagementQuickLinks />
            </div>
        </DashboardGrid>
        <RoleMissionCard profile={profile} />
    </div>
  )
}
