
'use client';

import { useMemo } from 'react';
import type { Activity, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Trophy, Users as UsersIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { formatCurrency } from '@/lib/utils';
import { startOfMonth } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { EmptyState } from '../ui/empty-state';

interface TeamPerformanceLeaderboardProps {
    activities: Activity[] | null;
    users: User[] | null;
    isLoading: boolean;
}

const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2).toUpperCase();
};

export function TeamPerformanceLeaderboard({ activities, users, isLoading }: TeamPerformanceLeaderboardProps) {
  
  const leaderboardData = useMemo(() => {
    if (!activities || !users) {
      return [];
    }
    
    const monthStart = startOfMonth(new Date());
    const monthlyActivities = activities.filter(a => a.loggedAt && a.loggedAt.toDate() >= monthStart);

    const userPerformance = users.map(user => {
      const userActivities = monthlyActivities.filter(a => a.userId === user.id);
      const totalValue = userActivities.reduce((sum, act) => sum + act.totalValue, 0);
      return {
        user,
        totalValue,
        activityCount: userActivities.length,
      };
    });

    const sortedUsers = userPerformance
        .filter(p => p.totalValue > 0)
        .sort((a, b) => b.totalValue - a.totalValue);
        
    const maxValue = sortedUsers[0]?.totalValue || 0;

    return sortedUsers.map((p, index) => ({
      ...p,
      rank: index + 1,
      progress: maxValue > 0 ? (p.totalValue / maxValue) * 100 : 0,
    }));

  }, [activities, users]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            Team Performance Leaderboard
        </CardTitle>
        <CardDescription>Top contributors by value generated this month.</CardDescription>
      </CardHeader>
      <CardContent>
         <div className="space-y-4">
            {isLoading && (
                 Array.from({length: 3}).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </div>
                 ))
            )}
            {!isLoading && leaderboardData.length > 0 ? (
                leaderboardData.map(item => (
                    <div key={item.user.id}>
                        <div className="flex items-center gap-4">
                            <span className="text-lg font-bold w-6 text-center">{item.rank}</span>
                            <Avatar className="h-10 w-10 border">
                                <AvatarImage src={item.user.photoURL} />
                                <AvatarFallback>{getInitials(item.user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold">{item.user.name}</p>
                                <p className="text-sm text-muted-foreground">{formatCurrency(item.totalValue, true)} from {item.activityCount} activities</p>
                            </div>
                        </div>
                        <Progress value={item.progress} className="h-1 mt-2" />
                    </div>
                ))
            ) : (
                 !isLoading && (
                    <EmptyState
                        icon={UsersIcon}
                        title="No Performance Data"
                        description="No activities with generated value have been logged this month."
                        className="min-h-0"
                    />
                 )
            )}
         </div>
      </CardContent>
    </Card>
  );
}
