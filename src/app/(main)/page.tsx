'use client';

import { DashboardCalendar } from '@/components/dashboard/dashboard-calendar';
import { useUser } from '@/firebase';
import { QuickStatsSummary } from '@/components/dashboard/quick-stats-summary';
import { RecentCheckouts } from '@/components/dashboard/recent-checkouts';
import { NewCheckoutForm } from '@/components/dashboard/new-checkout-form';
import { Alerts } from '@/components/dashboard/alerts';

export default function DashboardPage() {
  const { user } = useUser();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-primary">
         {getGreeting()}, {user?.displayName?.split(' ')[0] || user?.email || 'User'} 🌞 | Building Youth. Building Change.
        </h1>
        <p className="text-sm text-muted-foreground">
          {dateString} | Mpigi District, Uganda (EAT)
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8 flex flex-col gap-6">
          <QuickStatsSummary />
          <RecentCheckouts />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
           <NewCheckoutForm />
           <DashboardCalendar />
           <Alerts isLoading={false} />
        </div>

      </div>

       <footer className="text-center text-xs text-muted-foreground mt-4">
        “Omuto Central – Empowering Youth, Transforming Communities.” © {new Date().getFullYear()} Omuto Foundation | Built for Impact, by Youth.
      </footer>
    </div>
  );
}
