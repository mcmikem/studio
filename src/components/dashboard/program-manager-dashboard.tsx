
'use client';

import dynamic from 'next/dynamic'
import type { DashboardProps } from "./dashboard-loader"
import { Skeleton } from '../ui/skeleton';
import { DashboardHeader } from "./dashboard-header"
import { RoleMissionCard } from "./role-mission-card"
import { DashboardSection } from "./dashboard-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, BarChart3, Plus, GraduationCap, Heart, Flower2, Users, Building2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const PartnershipPipeline = dynamic(() => import('@/components/dashboard/program-manager/partnership-pipeline').then(mod => mod.PartnershipPipeline), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});
const QuickInsights = dynamic(() => import('@/components/dashboard/program-manager/quick-insights').then(mod => mod.QuickInsights), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});
const MyWeeklyPlan = dynamic(() => import('@/components/dashboard/my-weekly-plan').then(mod => mod.MyWeeklyPlan), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});
const TeamDeployment = dynamic(() => import('@/components/dashboard/team-deployment').then(mod => mod.TeamDeployment), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});
const TeamPerformanceLeaderboard = dynamic(() => import('@/components/dashboard/team-performance-leaderboard').then(mod => mod.TeamPerformanceLeaderboard), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});
const ProgramHealthScore = dynamic(() => import('@/components/dashboard/program-health-score').then(mod => mod.ProgramHealthScore), {
  loading: () => <Skeleton className="h-48" />,
  ssr: false,
});

const QUICK_ACTIONS = [
  { href: '/school-xperience/log-visit', icon: ClipboardCheck, label: 'Log Visit', color: 'btn-omuto', sub: 'Monitor school visit' },
  { href: '/school-xperience/submit-scorecard', icon: GraduationCap, label: 'Scorecard', color: 'bg-blue-500 text-white hover:bg-blue-600', sub: 'Rate school performance' },
  { href: '/school-xperience/add-leader', icon: Users, label: 'Add Leader', color: 'bg-purple-500 text-white hover:bg-purple-600', sub: 'Register student leader' },
  { href: '/school-xperience/log-impact', icon: Flower2, label: 'Log Impact', color: 'bg-green-500 text-white hover:bg-green-600', sub: 'Trees, water, beneficiaries' },
  { href: '/school-xperience/planner', icon: Calendar, label: 'Planner', color: 'bg-orange-500 text-white hover:bg-orange-600', sub: 'Schedule school visits' },
  { href: '/school-xperience/pipeline', icon: Building2, label: 'Pipeline', color: 'bg-teal-500 text-white hover:bg-teal-600', sub: 'Registration pipeline' },
];

export function ProgramManagerDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      <Tabs defaultValue="quick" className="w-full">
        <TabsList className="h-11 rounded-xl bg-omuto-cream/50 border border-omuto-navy/10 p-1 mb-2">
          <TabsTrigger
            value="quick"
            className="h-9 rounded-lg font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Quick Actions
          </TabsTrigger>
          <TabsTrigger
            value="dashboard"
            className="h-9 rounded-lg font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="mt-0 space-y-4">
          <div className="bg-omuto-cream/20 rounded-2xl border border-omuto-navy/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="h-4 w-4 text-omuto-red" />
              <span className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">What would you like to do?</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {QUICK_ACTIONS.map(action => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.href}
                    asChild
                    className={`h-auto py-3 rounded-xl flex-col gap-1.5 shadow-md hover:-translate-y-0.5 transition-all ${action.color}`}
                  >
                    <Link href={action.href}>
                      <Icon className="h-5 w-5" />
                      <span className="font-black text-[10px] uppercase tracking-wider leading-tight">{action.label}</span>
                      <span className="text-[9px] opacity-75 font-medium leading-tight">{action.sub}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-0 space-y-4">
          <DashboardSection title="Partnerships & Pipeline" description="School registration pipeline and partnership status" icon={Building2} defaultOpen={true}>
            <PartnershipPipeline />
          </DashboardSection>
          <DashboardSection title="Team" description="Deployment and performance" icon={Users} defaultOpen={true}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TeamDeployment />
              <TeamPerformanceLeaderboard />
            </div>
          </DashboardSection>
          <DashboardSection title="Programme Health" description="Auto-calculated from activity frequency and form submissions" icon={BarChart3} defaultOpen={false}>
            <ProgramHealthScore />
          </DashboardSection>
        </TabsContent>
      </Tabs>
      <RoleMissionCard profile={profile} />
    </div>
  );
}
