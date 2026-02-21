"use client"

import type { User as UserProfileType } from "@/lib/types"
import { ManagementQuickLinks } from "@/components/dashboard/management-quick-links"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import dynamic from 'next/dynamic'
import type { DashboardProps, DashboardData } from "./dashboard-loader"
import { Skeleton } from "../ui/skeleton";
import { DashboardHeader } from "./dashboard-header"

const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), { loading: () => <Skeleton className="h-64" />, ssr: false });
const DashboardCalendar = dynamic(() => import('@/components/dashboard/dashboard-calendar').then(mod => mod.DashboardCalendar), { loading: () => <Skeleton className="h-64" />, ssr: false });
const PartnershipPipeline = dynamic(() => import('@/components/dashboard/program-manager/partnership-pipeline').then(mod => mod.PartnershipPipeline), { loading: () => <Skeleton className="h-64" />, ssr: false });
const TeamPerformanceLeaderboard = dynamic(() => import('@/components/dashboard/team-performance-leaderboard').then(mod => mod.TeamPerformanceLeaderboard), { loading: () => <Skeleton className="h-64" />, ssr: false });

interface AdminDashboardProps extends DashboardProps {
    data: DashboardData;
}

export function AdminDashboard({ profile, data }: AdminDashboardProps) {
  const { users, checkins, partnerships, checkouts, activities, allExpenses, testimonies } = data;
  const isLoading = !users || !checkins || !partnerships || !checkouts || !activities;

  return (
    <div className="flex flex-col gap-6">
        <DashboardHeader profile={profile} />
        <DashboardGrid className="mt-6 lg:grid-cols-2">
            {isLoading ? (
                <>
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </>
            ) : (
                <>
                    <div className="flex flex-col gap-6">
                         <TeamPerformanceLeaderboard 
                            activities={activities} 
                            users={users} 
                            checkins={checkins} 
                            checkouts={checkouts} 
                            expenses={allExpenses}
                            testimonies={testimonies}
                            isLoading={false} 
                        />
                        <TeamDeployment users={users} checkins={checkins} isLoading={false} />
                        <PartnershipPipeline partnerships={partnerships} isLoading={false} />
                    </div>
                    <div className="flex flex-col gap-6">
                        <DashboardCalendar />
                        <ManagementQuickLinks />
                    </div>
                </>
            )}
        </DashboardGrid>
    </div>
  )
}
