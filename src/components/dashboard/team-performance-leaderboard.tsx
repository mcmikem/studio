'use client';

import { useMemo } from 'react';
import type { Activity, User, Checkin, Checkout, Partnership, Expense, Testimony } from '@/lib/types';
import { Trophy, Medal, Zap, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
    partnerships,
    expenses,
    testimonies 
}: TeamPerformanceLeaderboardProps) {
  
  const leaderboard = useMemo(() => {
    if (!users) return [];

    const userStats = new Map<string, { 
      userId: string; 
      name: string; 
      photoURL?: string; 
      role: string;
      totalScore: number; 
      activityCount: number;
    }>();

    const getOrInitStats = (userId: string, userName?: string) => {
        if (userStats.has(userId)) return userStats.get(userId)!;
        
        const userProfile = users.find(u => u.id === userId);
        const stats = {
            userId,
            name: userProfile?.name || userName || 'Unknown User',
            photoURL: userProfile?.photoURL,
            role: userProfile?.role || 'Staff',
            totalScore: 0,
            activityCount: 0,
        };
        userStats.set(userId, stats);
        return stats;
    };

    activities?.forEach((act) => {
      const stats = getOrInitStats(act.userId, act.userName);
      const score = 100 + ((act.totalValue || 0) / 5000); 
      stats.totalScore += score;
      stats.activityCount += 1;
    });

    checkins?.forEach((cin) => {
        const stats = getOrInitStats(cin.userId, cin.name);
        stats.totalScore += 20;
        stats.activityCount += 1;
    });

    checkouts?.forEach((cout) => {
        const stats = getOrInitStats(cout.userId, cout.name);
        stats.totalScore += 50;
        stats.activityCount += 1;
    });

    testimonies?.forEach((test) => {
        const stats = getOrInitStats(test.userId, test.userName);
        stats.totalScore += 75;
        stats.activityCount += 1;
    });

    expenses?.forEach((exp) => {
        const stats = getOrInitStats(exp.userId, exp.userName);
        stats.totalScore += 10;
        stats.activityCount += 1;
    });

    return Array.from(userStats.values())
      .filter(u => u.totalScore > 0)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);
  }, [activities, checkins, checkouts, users, partnerships, expenses, testimonies]);

  if (isLoading) {
    return <Skeleton className="h-96 rounded-3xl border-4 border-omuto-navy shadow-comic" />;
  }

  return (
    <Card className="rounded-3xl border-4 border-omuto-navy shadow-comic bg-white overflow-hidden">
      <CardHeader className="bg-omuto-navy text-white pb-6 pt-8 px-8 border-b-4 border-omuto-red">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-omuto-yellow fill-omuto-yellow" />
                <CardTitle className="text-3xl font-heading font-black italic tracking-tighter uppercase">Impact Stars</CardTitle>
            </div>
            <CardDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest mt-1">Global Action Ranking</CardDescription>
          </div>
          <div className="bg-omuto-red px-4 py-2 border-2 border-white rounded shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
             <span className="font-black text-xs uppercase tracking-tighter">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-6 bg-omuto-cream/50">
        {leaderboard.length > 0 ? (
          leaderboard.map((user, index) => (
            <div key={user.userId} className={`flex items-center gap-4 p-4 rounded-2xl border-[3px] border-omuto-navy transition-all group ${index === 0 ? 'bg-omuto-yellow shadow-comic-sm' : 'bg-white hover:translate-x-1'}`}>
              <div className="flex items-center justify-center w-10">
                {index === 0 ? <Crown className="h-8 w-8 text-omuto-navy animate-bounce" /> : 
                 <span className="font-black text-xl italic text-omuto-navy/30">#{index + 1}</span>}
              </div>
              <div className="relative">
                <Avatar className="h-12 w-12 border-[3px] border-omuto-navy shadow-sm">
                    <AvatarImage src={user.photoURL} />
                    <AvatarFallback className="bg-omuto-navy text-white font-black">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {index === 0 && <div className="absolute -top-1 -right-1 bg-omuto-red border-2 border-omuto-navy rounded-full p-1"><Zap className="h-2 w-2 text-white fill-white" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-black truncate leading-tight italic text-omuto-navy uppercase">{user.name}</p>
                <p className="text-[10px] text-omuto-navy/60 truncate mt-1 font-black uppercase tracking-widest">{user.role}</p>
              </div>
              <div className="text-right">
                <div className={`px-4 py-1.5 border-[3px] border-omuto-navy font-black text-sm italic rounded-xl ${index === 0 ? 'bg-white' : 'bg-omuto-cream shadow-comic-sm'}`}>
                    {Math.round(user.totalScore).toLocaleString()}
                </div>
                <p className="text-[9px] font-black text-omuto-navy/40 mt-2 uppercase tracking-tighter">{user.activityCount} ACTIONS</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white border-[3px] border-omuto-navy border-dashed rounded-3xl">
             <Zap className="h-16 w-16 mx-auto mb-4 opacity-10 text-omuto-navy" />
             <p className="text-xs font-black text-omuto-navy/40 uppercase tracking-[0.2em]">Deploying Intelligence...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
