import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Users, Activity, HandCoins, Video } from 'lucide-react';

const mockStats = [
    { title: 'Active Projects', icon: Briefcase },
    { title: 'Youth Reached (Month)', icon: Users },
    { title: 'Schools Engaged', icon: Activity },
    { title: 'Funds Spent (Oct)', icon: HandCoins },
    { title: 'New Media Uploads', icon: Video },
];

export function StatsCards({ isLoading = true }: { isLoading?: boolean }) {
  if (isLoading) {
    return (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {mockStats.map((card) => (
                <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <card.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-3/4 mt-2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
  }

  // This part will be replaced with live data fetching logic.
  // For now, it will render nothing if not loading.
  return null;
}
