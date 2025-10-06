'use client';

import { DashboardCalendar } from '@/components/dashboard/dashboard-calendar';
import { useUser } from '@/firebase';
import { ProgramsOverview } from '@/components/dashboard/programs-overview';
import { ImpactOverview } from '@/components/dashboard/impact-overview';
import { Alerts } from '@/components/dashboard/alerts';
import { DailyActions } from '@/components/dashboard/daily-actions';
import { TeamActivityFeed } from '@/components/dashboard/team-activity-feed';

export default function DashboardPage() {
  const { user } = useUser();

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

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-primary">
          {getGreeting()},{' '}
          {user?.displayName?.split(' ')[0] || user?.email || 'User'} 🚀 |
          Building Youth. Building Change.
        </h1>
        <p className="text-sm text-muted-foreground">
          {dateString} | Mpigi District, Uganda (EAT)
        </p>
      </header>

      <div className="space-y-6">
        <ImpactOverview />
        <ProgramsOverview />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <TeamActivityFeed />
          </div>
          <div className="flex flex-col gap-6">
             <DailyActions />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2">
             <DashboardCalendar />
           </div>
           <div>
             <Alerts />
           </div>
        </div>

      </div>

      <footer className="text-center text-xs text-muted-foreground mt-4">
        “Omuto Central – Empowering Youth, Transforming Communities.” ©{' '}
        {new Date().getFullYear()} Omuto Foundation | Built for Impact, by
        Youth.
      </footer>
    </div>
  );
}
