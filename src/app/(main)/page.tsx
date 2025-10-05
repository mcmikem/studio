'use client';

import { DashboardCalendar } from '@/components/dashboard/dashboard-calendar';
import { useUser } from '@/firebase';
import { QuickStatsSummary } from '@/components/dashboard/quick-stats-summary';
import { RecentCheckouts } from '@/components/dashboard/recent-checkouts';
import { NewCheckoutForm } from '@/components/dashboard/new-checkout-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Users } from 'lucide-react';

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
         {getGreeting()}, {user?.displayName?.split(' ')[0] || user?.email || 'User'} 🚀 | Building Youth. Building Change.
        </h1>
        <p className="text-sm text-muted-foreground">
          {dateString} | Mpigi District, Uganda (EAT)
        </p>
      </header>
      
      <div className="space-y-6">
        <QuickStatsSummary />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
                 <DashboardCalendar />
            </div>
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5" />
                            My Priorities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                           <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-primary"></div>
                           <span>Approve October budget - Due Today</span>
                        </div>
                         <div className="flex items-center gap-3">
                           <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-primary"></div>
                           <span>Review Omuto Pulse script - Due Oct 7</span>
                        </div>
                         <div className="flex items-center gap-3">
                           <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-primary"></div>
                           <span>Call with Mr. Akera (Resource Mobilization) - Due Oct 8</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Users className="h-5 w-5" />
                           Team Today
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                       <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 rounded-full bg-green-500"></span>
                            <span>McMike (Online - HQ)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 rounded-full bg-green-500"></span>
                            <span>Kasirye (In Field - Nindye SS)</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 rounded-full bg-yellow-500"></span>
                            <span>Dianah (In Meeting - Kampala)</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 rounded-full bg-red-500"></span>
                            <span>Bwire (Not Checked In)</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentCheckouts />
          </div>
          <div>
            <NewCheckoutForm />
          </div>
        </div>

      </div>

       <footer className="text-center text-xs text-muted-foreground mt-4">
        “Omuto Central – Empowering Youth, Transforming Communities.” © {new Date().getFullYear()} Omuto Foundation | Built for Impact, by Youth.
      </footer>
    </div>
  );
}
