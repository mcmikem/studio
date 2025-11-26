
'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Activity, User, Checkin, Checkout } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Trophy, Users as UsersIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { EmptyState } from '../ui/empty-state';
import { useMemoFirebase } from '@/firebase';

interface TeamPerformanceLeaderboardProps {
    activities: Activity[] | null;
    checkins: Checkin[] | null;
    checkouts: Checkout[] | null;
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

export function TeamPerformanceLeaderboard({ activities, checkins, checkouts, users, isLoading }: TeamPerformanceLeaderboardProps) {
  
  const leaderboardData = useMemo(() => {
    if (!users || isLoading) {
      return [];
    }

    const userPerformance = users.map(user => {
      const userActivities = activities?.filter(a => a.userId === user.id) || [];
      const userCheckins = checkins?.filter(c => c.userId === user.id) || [];
      const userCheckouts = checkouts?.filter(c => c.userId === user.id) || [];

      // New Engagement Score Logic
      const activityScore = userActivities.length * 10;
      
      const checkinScore = userCheckins.reduce((score, checkin) => {
          const checkinTime = checkin.timestamp.toDate();
          // Bonus for checking in before 10 AM
          if (checkinTime.getHours() < 10) {
              return score + 10; // +5 base, +5 bonus
          }
          return score + 5;
      }, 0);

      const checkoutScore = userCheckouts.length * 5;
      
      const totalScore = activityScore + checkinScore + checkoutScore;
      
      return {
        user,
        totalScore,
        activityCount: userActivities.length,
        checkinCount: userCheckins.length,
        checkoutCount: userCheckouts.length,
      };
    });

    const sortedUsers = userPerformance
        .filter(p => p.totalScore > 0)
        .sort((a, b) => b.totalScore - a.totalScore);
        
    const maxScore = sortedUsers[0]?.totalScore || 0;

    return sortedUsers.map((p, index) => ({
      ...p,
      rank: index + 1,
      progress: maxScore > 0 ? (p.totalScore / maxScore) * 100 : 0,
    }));

  }, [activities, users, checkins, checkouts, isLoading]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            Team Performance Leaderboard
        </CardTitle>
        <CardDescription>Top contributors by engagement in the last 30 days.</CardDescription>
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
                leaderboardData.slice(0, 5).map(item => (
                    <div key={item.user.id}>
                        <div className="flex items-center gap-4">
                            <span className="text-lg font-bold w-6 text-center">{item.rank}</span>
                            <Avatar className="h-10 w-10 border">
                                <AvatarImage src={item.user.photoURL} />
                                <AvatarFallback>{getInitials(item.user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold">{item.user.name}</p>
                                <p className="text-sm text-muted-foreground">{item.totalScore} points ({item.activityCount} logs, {item.checkinCount} check-ins)</p>
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
                        description="No team activities have been logged in the last 30 days."
                        className="min-h-0"
                    />
                 )
            )}
         </div>
      </CardContent>
    </Card>
  );
}
