'use client';

import { DashboardCalendar } from '@/components/dashboard/dashboard-calendar';
import { useUser } from '@/firebase';
import { QuickStatsSummary } from '@/components/dashboard/quick-stats-summary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListChecks, Newspaper } from 'lucide-react';

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
  const timeString = today.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
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
      
      {/* Main Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CENTER PANEL – Calendar & Stats */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <DashboardCalendar />
          <QuickStatsSummary />
        </div>

        {/* RIGHT PANEL – Tasks & Announcements */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           <Card>
              <CardHeader>
                <CardTitle>Daily & Weekly Tasks</CardTitle>
                <CardDescription>Your upcoming priorities.</CardDescription>
              </CardHeader>
              <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <ListChecks className="mx-auto h-8 w-8" />
                  <p className="mt-2 text-sm">Task board coming soon.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Announcements & Feed</CardTitle>
                 <CardDescription>Team updates and milestones.</CardDescription>
              </CardHeader>
               <CardContent className="h-72 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Newspaper className="mx-auto h-8 w-8" />
                  <p className="mt-2 text-sm">Live feed coming soon.</p>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
       <footer className="text-center text-xs text-muted-foreground mt-4">
        “Omuto Central – Empowering Youth, Transforming Communities.” © {new Date().getFullYear()} Omuto Foundation | Built for Impact, by Youth.
      </footer>
    </div>
  );
}
