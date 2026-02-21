
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import type { Activity, User, Checkin, Checkout, Partnership, Expense, Testimony } from '@/lib/types';
import { Trophy, Medal, Zap, Crown, Info, Target, TrendingUp, BarChart3, Clock, Receipt, Video, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { subMonths } from 'date-fns';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function TeamPerformancePage() {
  const firestore = useFirestore();

  const thirtyDaysAgo = useMemo(() => subMonths(new Date(), 1), []);

  // 1. Fetch All Required Data
  const activitiesQuery = useMemoFirebase((db) => db ? query(collection(db, 'activities'), where('loggedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)), orderBy('loggedAt', 'desc')) : null, [thirtyDaysAgo]);
  const checkinsQuery = useMemoFirebase((db) => db ? query(collection(db, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo))) : null, [thirtyDaysAgo]);
  const checkoutsQuery = useMemoFirebase((db) => db ? query(collection(db, 'checkouts'), where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo))) : null, [thirtyDaysAgo]);
  const expensesQuery = useMemoFirebase((db) => db ? query(collection(db, 'expenses'), where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))) : null, [thirtyDaysAgo]);
  const testimoniesQuery = useMemoFirebase((db) => db ? query(collection(db, 'testimonies'), where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))) : null, [thirtyDaysAgo]);
  const usersQuery = useMemoFirebase((db) => db ? query(collection(db, 'users')) : null, []);

  const { data: activities, isLoading: isActLoading } = useCollection<Activity>(activitiesQuery);
  const { data: checkins, isLoading: isCinLoading } = useCollection<Checkin>(checkinsQuery);
  const { data: checkouts, isLoading: isCoutLoading } = useCollection<Checkout>(checkoutsQuery);
  const { data: expenses, isLoading: isExpLoading } = useCollection<Expense>(expensesQuery);
  const { data: testimonies, isLoading: isTestLoading } = useCollection<Testimony>(testimoniesQuery);
  const { data: users, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  const isLoading = isActLoading || isCinLoading || isCoutLoading || isExpLoading || isTestLoading || isUsersLoading;

  // 2. Comprehensive Scoring Logic
  const leaderboardData = useMemo(() => {
    if (!users) return [];

    const statsMap = new Map<string, {
      userId: string;
      name: string;
      photoURL?: string;
      role: string;
      totalScore: number;
      actions: { type: string, count: number, score: number }[];
      recentActivity: { type: string, title: string, date: any }[];
    }>();

    const getStats = (userId: string, userName?: string) => {
      if (statsMap.has(userId)) return statsMap.get(userId)!;
      const user = users.find(u => u.id === userId);
      const initial = {
        userId,
        name: user?.name || userName || 'Staff Member',
        photoURL: user?.photoURL,
        role: user?.role || 'Staff',
        totalScore: 0,
        actions: [],
        recentActivity: [],
      };
      statsMap.set(userId, initial);
      return initial;
    };

    const addAction = (userId: string, type: string, score: number, title: string, date: any) => {
        const s = getStats(userId);
        s.totalScore += score;
        
        const actionIndex = s.actions.findIndex(a => a.type === type);
        if (actionIndex > -1) {
            s.actions[actionIndex].count += 1;
            s.actions[actionIndex].score += score;
        } else {
            s.actions.push({ type, count: 1, score });
        }

        if (s.recentActivity.length < 5) {
            s.recentActivity.push({ type, title, date });
        }
    };

    activities?.forEach(a => addAction(a.userId, 'ROI Activity', 100 + ((a.totalValue || 0) / 5000), a.title, a.loggedAt));
    checkins?.forEach(c => addAction(c.userId, 'Check-in', 20, `Daily Mission: ${c.primaryMission}`, c.timestamp));
    checkouts?.forEach(c => addAction(c.userId, 'Check-out', 50, 'Daily Report Submitted', c.timestamp));
    testimonies?.forEach(t => addAction(t.userId, 'Testimony', 75, t.title, t.createdAt));
    expenses?.forEach(e => addAction(e.userId, 'Expense Report', 10, e.title, e.createdAt));

    return Array.from(statsMap.values())
        .filter(u => u.totalScore > 0)
        .sort((a, b) => b.totalScore - a.totalScore);
  }, [activities, checkins, checkouts, expenses, testimonies, users]);


  if (isLoading) {
      return (
          <div className="space-y-6">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Skeleton className="h-96 lg:col-span-1 rounded-2xl" />
                  <Skeleton className="h-96 lg:col-span-2 rounded-2xl" />
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-10 pb-20">
       <header className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-omuto-navy">
                <div className="p-3 bg-omuto-navy/10 rounded-2xl">
                    <Trophy className="h-8 w-8 text-omuto-red" />
                </div>
                <div>
                    <h1 className="font-heading text-4xl font-black tracking-tight">Impact <span className="text-omuto-red">Stars</span></h1>
                    <p className="text-omuto-navy/60 font-bold uppercase text-[10px] tracking-widest">Team Performance & App Engagement Analytics</p>
                </div>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: The Rankings */}
            <div className="lg:col-span-5 space-y-6">
                 <Card className="card-comic-hero overflow-hidden">
                    <CardHeader className="bg-omuto-navy text-white pb-6 pt-8 px-8 border-b-lg border-omuto-red">
                        <CardTitle className="text-2xl font-black uppercase tracking-tighter">Global Rankings</CardTitle>
                        <CardDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest mt-1">Points reset every 30 days to keep things fresh.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 bg-omuto-cream/50">
                        {leaderboardData.map((user, index) => (
                             <div key={user.userId} className={`flex items-center gap-4 p-6 border-b-md border-omuto-navy/10 last:border-b-0 transition-colors ${index === 0 ? 'bg-omuto-yellow/20' : 'hover:bg-omuto-cream'}`}>
                                <div className="flex flex-col items-center justify-center w-10">
                                    {index === 0 ? <Crown className="h-7 w-7 text-omuto-yellow fill-omuto-yellow animate-pulse" /> : 
                                     index === 1 ? <Medal className="h-6 w-6 text-omuto-navy/40" /> :
                                     index === 2 ? <Medal className="h-6 w-6 text-omuto-brown" /> : 
                                     <span className="font-black text-omuto-navy/40">#{index + 1}</span>}
                                </div>
                                <Avatar className="h-14 w-14 border-lg border-omuto-navy shadow-comic-sm">
                                    <AvatarImage src={user.photoURL} />
                                    <AvatarFallback className="bg-omuto-navy text-white font-black">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-lg truncate leading-tight text-omuto-navy">{user.name}</p>
                                    <p className="text-[10px] text-omuto-navy/60 truncate mt-0.5 font-black uppercase tracking-widest">{user.role}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-primary leading-none">{Math.round(user.totalScore).toLocaleString()}</p>
                                    <p className="text-[9px] font-black text-omuto-navy/40 uppercase mt-1">Impact Pts</p>
                                </div>
                             </div>
                        ))}
                    </CardContent>
                 </Card>

                 <Card className="card-comic-hero bg-omuto-navy text-white p-8">
                    <CardHeader className="p-0 mb-6">
                        <div className="p-3 bg-white/20 rounded-2xl w-fit mb-4">
                            <Info className="h-5 w-5 text-omuto-yellow" />
                        </div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tighter">How points are calculated</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <span className="text-sm font-black uppercase tracking-widest text-white/70">ROI Activity</span>
                            <span className="font-black text-base">100+ Pts</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <span className="text-sm font-black uppercase tracking-widest text-white/70">Field Testimony</span>
                            <span className="font-black text-base">75 Pts</span>
                        </div>
                         <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <span className="text-sm font-black uppercase tracking-widest text-white/70">Daily Checkout</span>
                            <span className="font-black text-base">50 Pts</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <span className="text-sm font-black uppercase tracking-widest text-white/70">Daily Check-in</span>
                            <span className="font-black text-base">20 Pts</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-black uppercase tracking-widest text-white/70">Expense Report</span>
                            <span className="font-black text-base">10 Pts</span>
                        </div>
                    </CardContent>
                 </Card>
            </div>

            {/* Right Column: Detailed Breakdown */}
            <div className="lg:col-span-7 space-y-8">
                <Tabs defaultValue={leaderboardData[0]?.userId} className="w-full">
                    <div className="flex items-center justify-between mb-4">
                         <h2 className="text-2xl font-black tracking-tighter uppercase text-omuto-navy">Contribution <span className="text-omuto-red underline decoration-4 underline-offset-4">Deep-Dive</span></h2>
                    </div>
                    
                    {leaderboardData.length > 0 ? (
                        <>
                            <ScrollArea className="w-full whitespace-nowrap pb-4">
                                <TabsList className="flex gap-4 bg-transparent p-0 justify-start">
                                    {leaderboardData.map(u => (
                                        <TabsTrigger key={u.userId} value={u.userId} className="flex flex-col gap-1 p-3 min-w-[100px] rounded-2xl bg-omuto-cream border-lg border-omuto-navy/20 data-[state=active]:bg-omuto-red data-[state=active]:text-white data-[state=active]:border-omuto-navy data-[state=active]:shadow-comic-sm transition-all hover:bg-omuto-cream/50">
                                            <Avatar className="h-10 w-10 border-md border-omuto-navy shadow-sm">
                                                <AvatarImage src={u.photoURL} />
                                                <AvatarFallback className="bg-omuto-navy text-white font-black text-sm">{u.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-[10px] font-black truncate w-full text-omuto-navy uppercase">{u.name.split(' ')[0]}</span>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>

                            {leaderboardData.map(u => (
                                <TabsContent key={u.userId} value={u.userId} className="mt-0 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="card-comic-clean overflow-hidden">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/60 flex items-center gap-2"><Target className="h-3 w-3 text-omuto-red" /> Impact Distribution</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {u.actions.map((action, i) => (
                                                    <div key={i} className="space-y-1.5">
                                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                            <span className="text-omuto-navy/70">{action.type} ({action.count})</span>
                                                            <span className="text-primary">{Math.round(action.score)} pts</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden border border-omuto-navy/10">
                                                            <div 
                                                                className="h-full bg-secondary transition-all duration-1000 rounded-full" 
                                                                style={{ width: `${(action.score / u.totalScore) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>

                                        <Card className="card-comic-clean flex flex-col justify-center items-center text-center p-8">
                                            <div className="p-4 bg-omuto-red/10 border-lg border-omuto-red/20 rounded-2xl mb-4 text-omuto-red">
                                                <Zap className="h-10 w-10 fill-omuto-red/40" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-omuto-navy/50">Total Engagement</p>
                                            <p className="font-heading text-5xl font-black mt-2 tracking-tighter text-omuto-navy">{Math.round(u.totalScore).toLocaleString()}</p>
                                        </Card>
                                    </div>

                                    <Card className="card-comic-clean">
                                        <CardHeader>
                                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/60 flex items-center gap-2"><Clock className="h-3 w-3 text-omuto-red" /> Verified Timeline</CardTitle>
                                            <CardDescription className="text-omuto-navy/50">Most recent interactions validated by the platform.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="px-0">
                                            {u.recentActivity.map((act, i) => (
                                                <div key={i} className="flex items-start gap-4 px-6 py-4 border-b border-omuto-navy/5 last:border-b-0 hover:bg-omuto-cream/50 transition-colors">
                                                    <div className={`p-2 rounded-xl mt-1 ${act.type === 'ROI Activity' ? 'bg-omuto-red/10 text-omuto-red' : act.type === 'Check-out' ? 'bg-omuto-blue/10 text-omuto-blue' : act.type === 'Testimony' ? 'bg-omuto-teal/10 text-omuto-teal' : 'bg-muted/30 text-omuto-navy/60'}`}>
                                                        {act.type === 'ROI Activity' ? <BarChart3 className="h-4 w-4" /> :
                                                         act.type === 'Check-out' ? <MessageCircle className="h-4 w-4" /> :
                                                         act.type === 'Testimony' ? <Video className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black truncate text-omuto-navy">{act.title}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="secondary" className="text-[8px] font-black uppercase px-2 py-0 h-4 bg-omuto-navy/10 text-omuto-navy/60">{act.type}</Badge>
                                                            <span className="text-[10px] font-bold text-omuto-navy/40 uppercase">{formatDateSafe(act.date)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            ))}
                        </>
                    ) : (
                        <div className="text-center py-20 bg-omuto-cream/50 border-lg border-omuto-navy/20 border-dashed rounded-3xl">
                            <Zap className="h-16 w-16 mx-auto mb-6 opacity-10 text-omuto-navy" />
                            <h3 className="text-xl font-black uppercase text-omuto-navy">No Activity Detected</h3>
                            <p className="text-omuto-navy/50 font-bold mt-2">Log your first field activity to see the breakdown.</p>
                        </div>
                    )}
                </Tabs>
            </div>
        </div>
    </div>
  );
}
