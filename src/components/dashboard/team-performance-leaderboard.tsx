'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Activity, Checkin, Checkout, User, Expense, Testimony } from '@/lib/types';
import { Trophy, Crown, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { buildPerformanceSummary } from '@/lib/performance';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { subDays, formatDistanceToNow } from 'date-fns';

interface TeamPerformanceLeaderboardProps {}

export function TeamPerformanceLeaderboard(props: TeamPerformanceLeaderboardProps) {
  const firestore = useFirestore();
  const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30), []);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLastRefresh(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const queries = useMemo(() => {
    if (!firestore) return null;
    return {
      activities: query(collection(firestore, 'activities'), where('loggedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)), orderBy('loggedAt', 'desc')),
      checkins: query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)), orderBy('timestamp', 'desc')),
      checkouts: query(collection(firestore, 'checkouts'), where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)), orderBy('timestamp', 'desc')),
      expenses: query(collection(firestore, 'expenses'), where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)), orderBy('createdAt', 'desc')),
      testimonies: query(collection(firestore, 'testimonies'), where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)), orderBy('createdAt', 'desc')),
      users: query(collection(firestore, 'users'), orderBy('name')),
    };
  }, [firestore, thirtyDaysAgo]);

  const activities = useCollection<Activity>(queries?.activities);
  const checkins = useCollection<Checkin>(queries?.checkins);
  const checkouts = useCollection<Checkout>(queries?.checkouts);
  const expenses = useCollection<Expense>(queries?.expenses);
  const testimonies = useCollection<Testimony>(queries?.testimonies);
  const users = useCollection<User>(queries?.users);

  const isLoading = activities.isLoading || checkins.isLoading || checkouts.isLoading || expenses.isLoading || testimonies.isLoading || users.isLoading;
  const hasError = activities.error || checkins.error || checkouts.error || expenses.error || testimonies.error || users.error;
  const allLoaded = !isLoading && !hasError;

  const leaderboard = useMemo(
    () =>
      buildPerformanceSummary({
        users: users.data,
        activities: activities.data,
        checkins: checkins.data,
        checkouts: checkouts.data,
        expenses: expenses.data,
        testimonies: testimonies.data
      }).slice(0, 5),
    [users.data, activities.data, checkins.data, checkouts.data, expenses.data, testimonies.data]
  );

  if (isLoading) return <Skeleton className="h-96" />;

  if (hasError) {
    return (
      <Card className="rounded-[2rem] border-lg border-omuto-navy shadow-comic-sm overflow-hidden">
        <CardHeader className="bg-omuto-navy text-white pb-6 pt-8 px-6 border-b-4 border-omuto-red">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-omuto-yellow fill-omuto-yellow" />
            <CardTitle className="text-2xl font-bold tracking-tight">Impact Stars</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12 bg-card border-2 border-omuto-red/20 border-dashed rounded-2xl">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-omuto-red/60" />
            <p className="text-sm font-bold text-omuto-navy mb-2">Could not load leaderboard</p>
            <p className="text-xs text-omuto-navy/50 mb-4">One or more data sources failed to respond.</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="border-omuto-navy">
              <RefreshCw className="h-3 w-3 mr-2" /> Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[2rem] border-lg border-omuto-navy shadow-comic-sm overflow-hidden">
      <CardHeader className="bg-omuto-navy text-white pb-6 pt-8 px-6 border-b-4 border-omuto-red flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-omuto-yellow fill-omuto-yellow" />
              <CardTitle className="text-2xl font-bold tracking-tight">Impact Stars</CardTitle>
            </div>
            <CardDescription className="text-white/60 font-medium text-xs mt-1">Quality + ROI + Activity</CardDescription>
          </div>
          <div className="text-right">
            <div className="bg-omuto-red px-4 py-2 border-2 border-white rounded shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
              <span className="font-bold text-xs">Live</span>
            </div>
            <p className="text-white/40 text-[10px] mt-1 font-medium" title={lastRefresh.toISOString()}>
              Updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
            </p>
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
                  <AvatarFallback className="bg-omuto-navy text-white font-bold">{(user.name || '??').substring(0, 2).toUpperCase()}</AvatarFallback>
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
          <div className="text-center py-20 bg-white border-2 border-omuto-navy/20 border-dashed rounded-2xl">
            <Zap className="h-16 w-16 mx-auto mb-4 opacity-20 text-omuto-navy" />
            <p className="text-xs font-bold text-omuto-navy/50 uppercase tracking-widest">Awaiting Team Activity</p>
            <p className="text-[10px] text-omuto-navy/30 mt-2">Scores refresh automatically as activity is logged.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
