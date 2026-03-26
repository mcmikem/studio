'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  Timer, LogIn, LogOut, History,
  CheckCircle2, AlertTriangle, ArrowRight, ChevronRight,
  Calendar, Flame, MapPin, Clock,
  TrendingUp, Activity
} from 'lucide-react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where, orderBy, limit } from 'firebase/firestore';
import { formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function MyAttendancePage() {
  const { user } = useUser();
  
  const checkinsQuery = useMemoFirebase((db) => {
    if (!user) return null;
    return query(
      collection(db, 'checkins'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
  }, [user]);

  const { data: checkins, isLoading } = useCollection<any>(checkinsQuery);

  const calculateStreak = () => {
      // Placeholder for streak calculation logic
      return 12; 
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Attendance Terminal"
        description="Track your daily check-ins, mission duration, and consistency."
        icon={Timer}
      >
          <div className="flex gap-3">
              <Button asChild variant="outline" className="h-12 rounded-xl px-6 font-bold border-2">
                  <Link href="/forms/check-in"><LogIn className="mr-2 h-4 w-4" /> Check-in</Link>
              </Button>
              <Button asChild className="btn-omuto h-12 rounded-xl px-8 shadow-comic-sm">
                  <Link href="/forms/check-out"><LogOut className="mr-2 h-4 w-4" /> Check-out</Link>
              </Button>
          </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-primary/20 bg-primary/5 rounded-[2.5rem] shadow-xl overflow-hidden">
              <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Current Streak</p>
                      <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="text-4xl font-black text-primary tracking-tight">{calculateStreak()} <span className="text-xs font-bold uppercase opacity-40">Days</span></p>
              </CardContent>
          </Card>
          <Card className="border-2 border-omuto-navy/10 bg-card rounded-[2.5rem] shadow-xl overflow-hidden">
              <CardContent className="p-8">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">On-Time Arrival</p>
                   <p className="text-4xl font-black text-omuto-navy tracking-tight">98%</p>
              </CardContent>
          </Card>
           <Card className="border-2 border-emerald-500/10 bg-emerald-500/5 rounded-[2.5rem] shadow-xl overflow-hidden">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50 mb-4">Mission Status</p>
                  <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-lg font-black text-emerald-600 tracking-tight uppercase">Operational</p>
                  </div>
              </CardContent>
          </Card>
      </div>

      <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b bg-muted/30">
          <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight text-omuto-navy">Activity Log</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Your recent check-in and location history</CardDescription>
              </div>
              <Button variant="ghost" className="text-primary font-black uppercase tracking-widest text-[9px] hover:bg-primary/5">
                  View Full History →
              </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
          ) : checkins && checkins.length > 0 ? (
            <div className="divide-y divide-omuto-navy/5">
              {checkins.map((entry: any) => (
                <div key={entry.id} className="p-8 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                    <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-2xl bg-card border-2 border-omuto-navy/5 shadow-sm flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-omuto-navy tracking-tight uppercase">
                                {formatDateSafe(entry.timestamp, 'dateOnly')}
                            </p>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(entry.timestamp?.toDate?.() || entry.timestamp).toLocaleTimeString()}</span>
                                <span className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                                <span>{entry.locationName || 'Main Office'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Auto-Verified
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                    </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="py-24 text-center">
                 <Activity className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                 <p className="text-sm font-bold text-omuto-navy/40 uppercase tracking-widest">No activity recorded for this period.</p>
                 <Button asChild variant="link" className="mt-4 text-primary font-black uppercase tracking-widest text-[10px]">
                     <Link href="/">Force Sync Data →</Link>
                 </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
