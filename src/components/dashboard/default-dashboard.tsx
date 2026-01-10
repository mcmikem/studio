
"use client"

import type { User, Checkout, Checkin } from "@/lib/types"
import { DashboardGrid } from "./dashboard-grid"
import { Skeleton } from "../ui/skeleton"
import dynamic from "next/dynamic"
import { DashboardHeader } from "./dashboard-header"

const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});
const TeamPulse = dynamic(() => import('@/components/dashboard/team-activity-feed').then(mod => mod.TeamPulse), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});
const DashboardCalendar = dynamic(() => import('@/components/dashboard/dashboard-calendar').then(mod => mod.DashboardCalendar), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});
const MyWeeklyPlan = dynamic(() => import('@/components/dashboard/my-weekly-plan').then(mod => mod.MyWeeklyPlan), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
});

interface DefaultDashboardProps {
    users: User[] | null;
    checkins: Checkin[] | null;
    checkouts: Checkout[] | null;
    isLoading: boolean;
}

export function DefaultDashboard({ users, checkins, checkouts, isLoading }: DefaultDashboardProps) {
  return (
    <div className="flex flex-col gap-6">
        <DashboardHeader profile={{id: 'public', name: 'Guest', role: 'Guest', email: ''}} title="Welcome to Omuto Central"/>
        <DashboardGrid className="lg:grid-cols-2">
            <div className="flex flex-col gap-6">
                <DashboardCalendar />
                <MyWeeklyPlan />
            </div>
            <div className="flex flex-col gap-6">
                <TeamDeployment users={users} checkins={checkins} isLoading={isLoading} />
                <TeamPulse checkouts={checkouts} />
            </div>
        </DashboardGrid>
    </div>
  )
}
