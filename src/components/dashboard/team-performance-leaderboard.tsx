'use client';

import { useMemo } from 'react';
import type { Activity, Checkin, Checkout, User, Partnership, Expense, Testimony } from '@/lib/types';
import { Trophy, Crown, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buildPerformanceSummary } from '@/lib/performance';

interface TeamPerformanceLeaderboardProps {
  activities: Activity[] | null;
  checkins: Checkin[] | null;
  checkouts: Checkout[] | null;
  users: User[] | null;
  isLoading: boolean;
  partnerships?: Partnership[] | null;
  expenses?: Expense[] | null;
  testimonies?: Testimony[] | null;
}

export function TeamPerformanceLeaderboard({
  activities,
  checkins,
  checkouts,
  users,
  isLoading,
  expenses,
  testimonies,
}: TeamPerformanceLeaderboardProps) {
  const leaderboard = useMemo(
    () =>
      buildPerformanceSummary({ users, activities, checkins, checkouts, expenses, testimonies }).slice(0, 5),
    [users, activities, checkins, checkouts, expenses, testimonies]
  );

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <Card>
      <CardHeader className="bg-omuto-navy text-white pb-6 pt-8 px-8 border-b-4 border-omuto-red">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-omuto-yellow fill-omuto-yellow" />
              <CardTitle className="text-2xl font-bold tracking-tight">Impact Stars</CardTitle>
            </div>
            <CardDescription className="text-white/60 font-medium text-xs mt-1">Quality + ROI + Activity</CardDescription>
          </div>
          <div className="bg-omuto-red px-4 py-2 border-2 border-white rounded shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
            <span className="font-bold text-xs">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6 bg-omuto-cream/50">
        {leaderboard.length > 0 ? (
          leaderboard.map((user, index) => (
            <div key={user.userId} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all group ${index === 0 ? 'bg-omuto-yellow border-omuto-navy shadow-comic-sm' : 'bg-white border-omuto-navy/20 hover:border-omuto-navy/40 hover:bg-white'}`}>
              <div className="flex items-center justify-center w-10">
                {index === 0 ? <Crown className="h-7 w-7 text-omuto-navy" /> : <span className="font-bold text-lg text-omuto-navy/40">#{index + 1}</span>}
              </div>
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-omuto-navy">
                  <AvatarImage src={user.photoURL} />
                  <AvatarFallback className="bg-omuto-navy text-white font-bold">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {index === 0 && <div className="absolute -top-1 -right-1 bg-omuto-red border-2 border-omuto-navy rounded-full p-1"><Zap className="h-2 w-2 text-white fill-white" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base truncate leading-tight text-omuto-navy">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">{user.role}</p>
                <p className="text-[10px] text-omuto-navy/60 mt-1 font-bold uppercase">Q{user.qualityIndex} • {Math.round(user.activeMinutes / 60)}h active</p>
              </div>
              <div className="text-right">
                <div className="px-3 py-1.5 border-2 border-omuto-navy font-bold text-sm rounded-lg bg-white shadow-comic-sm">{Math.round(user.totalScore).toLocaleString()}</div>
                <p className="text-[9px] font-bold text-omuto-navy/50 mt-1 uppercase tracking-wider">{user.actions.reduce((s, a) => s + a.count, 0)} ACTIONS</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white border-2 border-omuto-navy/10 border-dashed rounded-2xl">
            <Zap className="h-16 w-16 mx-auto mb-4 opacity-10 text-omuto-navy" />
            <p className="text-xs font-bold text-omuto-navy/40 uppercase tracking-widest">Awaiting Team Activity...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
