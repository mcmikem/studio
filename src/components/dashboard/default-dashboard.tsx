'use client';

import { DashboardCalendar } from '@/components/dashboard/dashboard-calendar';
import { ProgramsOverview } from '@/components/dashboard/programs-overview';
import { ImpactOverview } from '@/components/dashboard/impact-overview';
import { Alerts } from '@/components/dashboard/alerts';
import { DailyActions } from '@/components/dashboard/daily-actions';
import { TeamActivityFeed } from '@/components/dashboard/team-activity-feed';
import type { User } from '@/lib/types';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

const today = new Date();
const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

export function DefaultDashboard({ profile }: { profile: User }) {
  const firstName = profile?.name?.split(' ')[0] || 'User';

  return (
    <>
      <header className="space-y-1">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-primary">
          {getGreeting()},{' '}
          {firstName} 🚀 |
          Building Youth. Building Change.
        </h1>
        <p className="text-sm text-muted-foreground">
          {dateString} | Mpigi District, Uganda (EAT)
        </p>
      </header>

       <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-3">
            <ImpactOverview />
        </div>
        <div className="xl:col-span-3">
            <ProgramsOverview />
        </div>
        <div className="lg:col-span-2 xl:col-span-2">
            <TeamActivityFeed />
        </div>
        <div className="lg:col-span-1 xl:col-span-1">
            <DailyActions />
        </div>
         <div className="lg:col-span-2 xl:col-span-2">
            <DashboardCalendar />
        </div>
        <div className="lg:col-span-1 xl:col-span-1">
             <Alerts />
        </div>
      </div>
    </>
  );
}
