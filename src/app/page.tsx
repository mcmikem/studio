import { ActivityChart } from '@/components/dashboard/activity-chart';
import { RecentCheckouts } from '@/components/dashboard/recent-checkouts';
import { StatsCards } from '@/components/dashboard/stats-cards';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s a snapshot of Omuto&apos;s activities.
        </p>
      </header>
      <div className="grid gap-6">
        <StatsCards />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="col-span-1 lg:col-span-3">
            <ActivityChart />
          </div>
          <div className="col-span-1 lg:col-span-2">
            <RecentCheckouts />
          </div>
        </div>
      </div>
    </div>
  );
}
