'use client';

import { useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import type { Activity, User, Checkin, Checkout, Expense, Testimony } from '@/lib/types';
import { Trophy, Medal, Crown, Clock, Download, BarChart3, MessageCircle, Video, Gauge } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { subDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { formatDateSafe } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Parser } from 'json2csv';
import { buildPerformanceSummary } from '@/lib/performance';

function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  const parser = new Parser();
  const csv = parser.parse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function TeamPerformancePage() {
  const { toast } = useToast();
  const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30), []);

  const activitiesQuery = useMemoFirebase((db) => db ? query(collection(db, 'activities'), where('loggedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)), orderBy('loggedAt', 'desc')) : null, [thirtyDaysAgo]);
  const checkinsQuery = useMemoFirebase((db) => db ? query(collection(db, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)), orderBy('timestamp', 'desc')) : null, [thirtyDaysAgo]);
  const checkoutsQuery = useMemoFirebase((db) => db ? query(collection(db, 'checkouts'), where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)), orderBy('timestamp', 'desc')) : null, [thirtyDaysAgo]);
  const expensesQuery = useMemoFirebase((db) => db ? query(collection(db, 'expenses'), where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)), orderBy('createdAt', 'desc')) : null, [thirtyDaysAgo]);
  const testimoniesQuery = useMemoFirebase((db) => db ? query(collection(db, 'testimonies'), where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)), orderBy('createdAt', 'desc')) : null, [thirtyDaysAgo]);
  const usersQuery = useMemoFirebase((db) => db ? query(collection(db, 'users'), orderBy('name')) : null, []);

  const { data: activities, isLoading: isActLoading } = useCollection<Activity>(activitiesQuery);
  const { data: checkins, isLoading: isCinLoading } = useCollection<Checkin>(checkinsQuery);
  const { data: checkouts, isLoading: isCoutLoading } = useCollection<Checkout>(checkoutsQuery);
  const { data: expenses, isLoading: isExpLoading } = useCollection<Expense>(expensesQuery);
  const { data: testimonies, isLoading: isTestLoading } = useCollection<Testimony>(testimoniesQuery);
  const { data: users, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  const isLoading = isActLoading || isCinLoading || isCoutLoading || isExpLoading || isTestLoading || isUsersLoading;

  const leaderboardData = useMemo(
    () => buildPerformanceSummary({ users, activities, checkins, checkouts, expenses, testimonies }),
    [users, activities, checkins, checkouts, expenses, testimonies]
  );

  const exportUserActivity = (userId: string) => {
    const user = leaderboardData.find((u) => u.userId === userId);
    if (!user) return;

    const rows: Array<Record<string, string | number>> = [];

    checkins?.filter((c) => c.userId === userId).forEach((c) => {
      rows.push({
        type: 'Check-in',
        person: user.name,
        when: formatDateSafe(c.timestamp),
        summary: c.primaryMission,
        quality: '',
      });
    });

    checkouts?.filter((c) => c.userId === userId).forEach((c) => {
      rows.push({
        type: 'Check-out',
        person: user.name,
        when: formatDateSafe(c.timestamp),
        summary: `${c.tasks?.filter((t) => t.status === 'Done').length || 0} tasks done`,
        quality: user.qualityIndex,
      });
    });

    activities?.filter((a) => a.userId === userId).forEach((a) => {
      rows.push({
        type: 'Activity',
        person: user.name,
        when: formatDateSafe(a.loggedAt),
        summary: a.title,
        quality: a.finalRoi || 0,
      });
    });

    downloadCsv(`activity-report-${user.name.replace(/\s+/g, '-').toLowerCase()}.csv`, rows);
    toast({ title: 'Export ready', description: `Compiled records for ${user.name}.` });
  };

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
          <div className="p-3 bg-omuto-navy/10 rounded-2xl"><Trophy className="h-8 w-8 text-omuto-red" /></div>
          <div>
            <h1 className="font-heading text-4xl font-black tracking-tight">Impact <span className="text-omuto-red">Stars</span></h1>
            <p className="text-omuto-navy/60 font-bold uppercase text-[10px] tracking-widest">Self-Evaluation + Verified Impact</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-omuto-navy text-white">
              <CardTitle>Global Rankings</CardTitle>
              <CardDescription className="text-white/70">Quality + ROI + verified active time (30 days).</CardDescription>
            </CardHeader>
            <CardContent className="p-0 bg-omuto-cream/50">
              {leaderboardData.map((user, index) => (
                <div key={user.userId} className={`flex items-center gap-4 p-4 border-b border-omuto-navy/10 last:border-b-0 ${index === 0 ? 'bg-omuto-yellow/20' : ''}`}>
                  <div className="w-8 text-center font-black text-omuto-navy/60">
                    {index === 0 ? <Crown className="h-6 w-6 text-omuto-yellow fill-omuto-yellow inline" /> : index <= 2 ? <Medal className="h-5 w-5 inline" /> : `#${index + 1}`}
                  </div>
                  <Avatar className="h-12 w-12 border border-omuto-navy/20">
                    <AvatarImage src={user.photoURL} />
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-primary leading-none">{Math.round(user.totalScore)}</p>
                    <p className="text-[10px] uppercase text-muted-foreground">Pts</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-lg shadow-comic-sm bg-omuto-blue/5">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase text-omuto-navy">How are Points Calculated?</CardTitle>
              <CardDescription className="text-[10px] font-bold">The ranking system rewards consistency and high-impact work.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-medium text-omuto-navy/80">
              <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-omuto-navy/10">
                <span>Field Activity (ROI)</span>
                <span className="font-black text-omuto-red">80-120 pts</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-omuto-navy/10">
                <span>Detailed Check-out</span>
                <span className="font-black text-omuto-red">Up to 80 pts</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-omuto-navy/10">
                <span>Success Testimony</span>
                <span className="font-black text-omuto-red">60 pts</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-omuto-navy/10">
                <span>Daily Check-in</span>
                <span className="font-black text-omuto-red">12 pts</span>
              </div>
              <p className="text-[10px] italic leading-relaxed pt-2">
                *Quality Index is based on task completion, level of detail, and showing learning/planning in your daily check-outs.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Tabs defaultValue={leaderboardData[0]?.userId} className="w-full">
            <ScrollArea className="w-full"><TabsList className="mb-4 h-auto p-2 gap-1 sm:gap-2 flex-wrap">
              {leaderboardData.map((u) => (
                <TabsTrigger key={u.userId} value={u.userId} className="min-w-[80px] sm:min-w-[120px] text-xs sm:text-sm">{u.name.split(' ')[0]}</TabsTrigger>
              ))}
            </TabsList><ScrollBar orientation="horizontal" /></ScrollArea>

            {leaderboardData.map((u) => (
              <TabsContent key={u.userId} value={u.userId} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card><CardHeader><CardTitle className="text-sm">Quality Index</CardTitle></CardHeader><CardContent className="text-3xl font-black flex items-center gap-2"><Gauge className="h-6 w-6 text-primary" />{u.qualityIndex}</CardContent></Card>
                  <Card><CardHeader><CardTitle className="text-sm">Active Time</CardTitle></CardHeader><CardContent className="text-3xl font-black">{Math.round(u.activeMinutes / 60)}h</CardContent></Card>
                  <Card><CardHeader><CardTitle className="text-sm">Actions</CardTitle></CardHeader><CardContent className="text-3xl font-black">{u.actions.reduce((s, a) => s + a.count, 0)}</CardContent></Card>
                </div>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Verified Timeline</CardTitle>
                      <CardDescription>Recent platform events and contribution quality signals.</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => exportUserActivity(u.userId)}>
                      <Download className="h-4 w-4 mr-2" /> Export Person Report
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {u.recentActivity.map((act, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="mt-1 text-primary">{act.type === 'ROI Activity' ? <BarChart3 className="h-4 w-4" /> : act.type === 'Check-out' ? <MessageCircle className="h-4 w-4" /> : <Video className="h-4 w-4" />}</div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{act.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{act.type}</Badge>
                            <span className="text-xs text-muted-foreground"><Clock className="h-3 w-3 inline mr-1" />{formatDateSafe(act.date)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
