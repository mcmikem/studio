'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  FileBadge, TrendingUp, BarChart3, 
  Trophy, Target, Star, 
  ArrowUpRight, ArrowDownRight,
  Zap, Heart, ShieldCheck, Users,
  ChevronRight, Activity
} from 'lucide-react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, orderBy, limit } from 'firebase/firestore';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const topPerformers = [
    { name: 'Sarah Namulondo', role: 'Programs Manager', score: 98, impact: 'High', trend: 'up' },
    { name: 'James Kasozi', role: 'Finance Lead', score: 95, impact: 'Consistent', trend: 'stable' },
    { name: 'Alice Nambogo', role: 'Field Coordinator', score: 92, impact: 'Rising', trend: 'up' },
];

export default function HRPerformancePage() {
  const staffQuery = useMemoFirebase((db) => query(collection(db, 'users'), orderBy('name')));
  const { data: staff, isLoading: isLoadingStaff } = useCollection<any>(staffQuery);

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
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Global Impact Score</p>
                  <p className="text-4xl font-black tracking-tight">94.2%</p>
                   <div className="flex items-center gap-1 mt-4 text-[9px] font-bold text-white uppercase tracking-widest">
                      <TrendingUp className="h-3 w-3" /> +2.4% vs Last Month
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
                  <h3 className="text-xl font-black text-omuto-navy uppercase tracking-tight">Personnel Mastery Matrix</h3>
                  <Button variant="ghost" className="text-primary font-black uppercase tracking-widest text-[9px]">Download Report →</Button>
              </div>

              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-0">
                      <div className="divide-y divide-omuto-navy/5">
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
                                      <div className="text-right hidden sm:block">
                                          <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Current Score</p>
                                          <p className="text-lg font-black text-omuto-navy">{(Math.random() * 20 + 75).toFixed(1)}%</p>
                                      </div>
                                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                                          Elite
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
                  <Trophy className="h-5 w-5 text-amber-500" /> Impact Stars
              </h3>
              
              <div className="space-y-4">
                  {topPerformers.map((p, i) => (
                      <Card key={i} className="border-2 border-amber-500/10 rounded-[2rem] p-6 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                               <Trophy className="h-16 w-16" />
                           </div>
                           <div className="flex items-center gap-4 mb-4">
                               <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 font-black">
                                   {i + 1}
                               </div>
                               <div>
                                   <p className="font-black text-omuto-navy uppercase tracking-tight">{p.name}</p>
                                   <p className="text-[9px] font-bold text-muted-foreground uppercase">Score: {p.score}%</p>
                               </div>
                           </div>
                           <div className="flex items-center justify-between px-2">
                               <Badge className="bg-amber-500/10 text-amber-600 border-none text-[8px] font-black tracking-widest lowercase">{p.impact} impact</Badge>
                               <div className={`flex items-center text-[9px] font-bold ${p.trend === 'up' ? 'text-emerald-600' : 'text-blue-600'} uppercase tracking-widest`}>
                                   {p.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <Activity className="h-3 w-3 mr-1" />}
                                   {p.trend}
                               </div>
                           </div>
                      </Card>
                  ))}
              </div>

              <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-card p-8">
                  <div className="flex items-start gap-4 h-full">
                      <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-600">
                          <Heart className="h-6 w-6" />
                      </div>
                      <div>
                          <h4 className="text-sm font-black text-omuto-navy uppercase tracking-tight mb-1">Team Wel-being</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                              94% of the team reported feeling "Empowered" in the latest pulse survey.
                          </p>
                      </div>
                  </div>
              </Card>
          </div>
      </div>
    </div>
  );
}
