
'use client';

import { DashboardGrid } from "./dashboard-grid"
import dynamic from "next/dynamic"
import { DashboardHeader } from "./dashboard-header"
import { Skeleton } from "../ui/skeleton";

const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), {
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

export function DefaultDashboard() {

  return (
    <div className="flex flex-col gap-6">
        <DashboardHeader profile={{id: 'public', name: 'Guest', role: 'Guest', email: ''}} title="Welcome to Omuto Central"/>
        <DashboardGrid className="lg:grid-cols-2">
            <div className="flex flex-col gap-6">
                <DashboardCalendar />
                <MyWeeklyPlan />
            </div>
            <div className="flex flex-col gap-6">
                <TeamDeployment />
            </div>
        </DashboardGrid>
    </div>
  )
}

    