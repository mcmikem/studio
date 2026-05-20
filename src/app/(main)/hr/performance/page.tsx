'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  FileBadge, TrendingUp, BarChart3, 
  Trophy, Target, Star, 
  Zap, Heart, Users,
  ChevronRight, Activity
} from 'lucide-react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export default function HRPerformancePage() {
  const staffQuery = useMemoFirebase((db) => query(collection(db, 'users'), orderBy('name')));
  const { data: staff, isLoading: isLoadingStaff } = useCollection<any>(staffQuery);

  const staffCount = staff?.length ?? 0;

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Performance Hub"
        description="Aggregate team-wide impact metrics, efficiency scores, and mission mastery."
        icon={FileBadge}
      >
          <Button className="btn-omuto h-12 px-6 shadow-comic-sm">
              <Target className="mr-2 h-4 w-4" /> Global OKRs
          </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-primary text-white">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Active Team Members</p>
                  <p className="text-4xl font-black tracking-tight">{isLoadingStaff ? '—' : staffCount}</p>
                   <div className="flex items-center gap-1 mt-4 text-[9px] font-bold text-white uppercase tracking-widest">
                      <Users className="h-3 w-3" /> Across All Roles
                  </div>
              </CardContent>
          </Card>
          <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-card">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Operational Consistency</p>
                  <p className="text-4xl font-black text-omuto-navy tracking-tight">89%</p>
                  <div className="flex items-center gap-1 mt-4 text-[9px] font-bold text-amber-600 uppercase tracking-widest">
                      <Activity className="h-3 w-3" /> Target: 95%
                  </div>
              </CardContent>
          </Card>
           <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-card">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Mission Efficiency</p>
                  <p className="text-4xl font-black text-omuto-navy tracking-tight">4.8/5</p>
                  <div className="flex items-center gap-1 mt-4 text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                      <Star className="h-3 w-3" /> Excellent Rating
                  </div>
              </CardContent>
          </Card>
           <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-omuto-navy text-white">
              <CardContent className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Reviews Completed</p>
                  <p className="text-4xl font-black tracking-tight">12/14</p>
                   <div className="flex items-center gap-1 mt-4 text-[9px] font-bold text-primary uppercase tracking-widest">
                      <Zap className="h-3 w-3" /> Q1 Cycle Active
                  </div>
              </CardContent>
          </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-omuto-navy uppercase tracking-tight">Personnel Directory</h3>
                  <Button variant="ghost" className="text-primary font-black uppercase tracking-widest text-[9px]">Download Report →</Button>
              </div>

              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-0">
                      <div className="divide-y divide-omuto-navy/5">
                          {isLoadingStaff && (
                            <div className="p-8 space-y-4">
                              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                            </div>
                          )}
                          {!isLoadingStaff && (!staff || staff.length === 0) && (
                            <div className="p-12 text-center text-muted-foreground">
                              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                              <p className="font-bold text-sm">No staff members found.</p>
                            </div>
                          )}
                          {staff?.map((m: any) => (
                              <div key={m.id} className="p-7 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                                  <div className="flex items-center gap-4">
                                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                          <AvatarImage src={m.photoURL} />
                                          <AvatarFallback className="text-xs font-black">{m.name?.[0]}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                          <p className="text-base font-black text-omuto-navy uppercase tracking-tight">{m.name}</p>
                                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{m.role}</p>
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-8">
                                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                                          Active
                                      </Badge>
                                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                                          <ChevronRight className="h-5 w-5 text-omuto-navy/20 group-hover:text-primary transition-colors" />
                                      </Button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </CardContent>
              </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
              <h3 className="text-xl font-black text-omuto-navy uppercase tracking-tight flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" /> Performance Insights
              </h3>
              
              <Card className="border-2 border-amber-500/10 rounded-[2rem] p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                      <BarChart3 className="h-16 w-16" />
                  </div>
                  <div className="flex items-start gap-4">
                      <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
                          <Trophy className="h-6 w-6" />
                      </div>
                      <div>
                          <h4 className="text-sm font-black text-omuto-navy uppercase tracking-tight mb-1">Performance Reviews</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                              Individual performance scores and review cycles are managed through the OKR system. Navigate to the OKRs section to track progress.
                          </p>
                      </div>
                  </div>
              </Card>

              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-card p-8">
                  <div className="flex items-start gap-4 h-full">
                      <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-600">
                          <Heart className="h-6 w-6" />
                      </div>
                      <div>
                          <h4 className="text-sm font-black text-omuto-navy uppercase tracking-tight mb-1">Team Well-being</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                              Check the latest Pulse survey results to see how the team is feeling.
                          </p>
                      </div>
                  </div>
              </Card>
          </div>
      </div>
    </div>
  );
}
