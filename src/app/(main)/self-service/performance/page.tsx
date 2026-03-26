'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  Sparkles, Target, Trophy, 
  BarChart3, Heart, Zap, 
  ArrowUpRight, Star, Award,
  Users, CheckCircle2, TrendingUp,
  FileBadge
} from 'lucide-react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where, orderBy, limit } from 'firebase/firestore';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { UserPerformance } from '@/components/profile/user-performance';
import { StickyFormFooter } from '@/components/sticky-form-footer';

export default function MyPerformancePage() {
  const { user } = useUser();

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="My Performance"
        description="Track your mission impact, efficiency scores, and institutional growth."
        icon={FileBadge}
      >
          <Button variant="outline" className="h-10 rounded-xl px-5 font-bold border">
              <Trophy className="mr-2 h-4 w-4" /> Mastery Badges
          </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
              {/* Core Metrics from UserPerformance component */}
              <UserPerformance userId={user?.uid || ''} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Card className="border shadow-sm bg-card">
                      <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                              <div className="p-2.5 bg-primary/5 rounded-xl text-primary"><Target className="h-5 w-5" /></div>
                              <Badge className="bg-primary/5 text-primary border-none text-[10px] font-bold uppercase tracking-wider">Active OKR</Badge>
                          </div>
                          <p className="text-sm font-bold text-omuto-navy mb-2">Quarterly Mission Growth</p>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
                              <div className="h-full bg-primary w-[85%] rounded-full" />
                          </div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">85% Complete</p>
                      </CardContent>
                  </Card>

                  <Card className="border shadow-sm bg-card">
                      <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600"><Award className="h-5 w-5" /></div>
                              <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-bold uppercase tracking-wider">Next Level</Badge>
                          </div>
                          <p className="text-sm font-bold text-omuto-navy mb-2">Senior Impact Lead</p>
                           <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Points: 2,450 / 3,000</p>
                      </CardContent>
                  </Card>
              </div>

              <Card className="border shadow-sm">
                   <CardHeader className="pb-4">
                        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                           <Zap className="h-4 w-4 text-primary" />
                           Growth Milestones
                        </CardTitle>
                   </CardHeader>
                   <CardContent className="p-0">
                       <div className="divide-y border-t">
                           {[
                               { title: 'Elite Field Coordinator', date: 'Jan 2026', icon: Star, color: 'text-amber-500' },
                               { title: '100% Data Integrity Streak', date: 'Dec 2025', icon: CheckCircle2, color: 'text-emerald-500' },
                               { title: 'Institutional Value Leader', date: 'Nov 2025', icon: Zap, color: 'text-primary' },
                           ].map((m, i) => (
                               <div key={i} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                   <div className="flex items-center gap-4">
                                       <div className={`p-2 rounded-lg bg-card border shadow-sm ${m.color}`}>
                                           <m.icon className="h-4 w-4" />
                                       </div>
                                       <div>
                                           <p className="text-sm font-bold text-omuto-navy">{m.title}</p>
                                           <p className="text-[11px] text-muted-foreground">{m.date}</p>
                                       </div>
                                   </div>
                                    <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase">Verified</Badge>
                               </div>
                           ))}
                       </div>
                   </CardContent>
              </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
              <Card className="border shadow-md bg-primary/5 p-8 text-center flex flex-col items-center border-primary/10">
                  <div className="h-16 w-16 rounded-2xl bg-card shadow-sm flex items-center justify-center mb-6">
                      <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-sm font-bold text-omuto-navy uppercase tracking-wider mb-2">Performance Rank</h4>
                  <p className="text-4xl font-bold text-primary tracking-tight mb-4">Top 5%</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                      You are among the most efficient team members at Omuto Foundation this month.
                  </p>
              </Card>

              <Card className="border shadow-sm bg-omuto-navy text-white p-6">
                  <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-card/10 rounded-xl text-white">
                          <Heart className="h-4 w-4" />
                      </div>
                      <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider mb-1">Impact Tip</h4>
                          <p className="text-[11px] text-white/70 leading-relaxed font-medium">
                              Consistent field check-ins increase your "Operational Consistency" score by 15%.
                          </p>
                      </div>
                  </div>
              </Card>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-4">
                   <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                       <Award className="h-4 w-4" />
                   </div>
                   <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider leading-tight">
                       Next Review: April 15th, 2026
                   </p>
              </div>
          </div>
      </div>

      <StickyFormFooter containerClassName="sm:hidden">
          <Button className="btn-omuto w-full shadow-lg font-bold uppercase tracking-wider text-[11px]">
              <Sparkles className="mr-2 h-4 w-4" /> Share Impact Report
          </Button>
      </StickyFormFooter>
    </div>
  );
}
