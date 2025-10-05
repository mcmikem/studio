'use client';

import { DashboardCalendar } from '@/components/dashboard/dashboard-calendar';
import { RecentCheckouts } from '@/components/dashboard/recent-checkouts';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { NewCheckoutForm } from '@/components/dashboard/new-checkout-form';
import { useUser } from '@/firebase';
import { ProjectsOverview } from '@/components/dashboard/projects-overview';
import { ImpactOverview } from '@/components/dashboard/impact-overview';
import { Alerts } from '@/components/dashboard/alerts';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.displayName || user?.email || 'User'}! Here&apos;s Omuto&apos;s heartbeat today.
        </p>
      </header>
      
      {/* Main Body (Three-Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CENTER PANEL – Organization Pulse */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <StatsCards isLoading={isUserLoading} />
          <ProjectsOverview isLoading={isUserLoading} />
          <ImpactOverview isLoading={isUserLoading} />
          <RecentCheckouts />
        </div>

        {/* RIGHT PANEL – Upcoming & Alerts */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <NewCheckoutForm />
          <DashboardCalendar />
          <Alerts isLoading={isUserLoading} />
        </div>
      </div>
    </div>
  );
}
