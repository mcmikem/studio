'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  Users, Palmtree, Timer, CreditCard, 
  ArrowUpRight, ArrowDownRight, UserPlus,
  ShieldCheck, Clock, FileBadge, TrendingUp,
  LayoutDashboard, UserCheck, UserMinus, Sparkles, CheckCircle2
} from 'lucide-react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where, limit, orderBy } from 'firebase/firestore';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function HRDashboard() {
  const staffQuery = useMemoFirebase((db) => query(collection(db, 'users')));
  const { data: staff, isLoading: isLoadingStaff } = useCollection<any>(staffQuery);

  const pendingLeaveQuery = useMemoFirebase((db) => 
    query(collection(db, 'leave-requests'), where('status', '==', 'Pending'), limit(5))
  );
  const { data: pendingLeave, isLoading: isLoadingLeave } = useCollection<any>(pendingLeaveQuery);

  const metrics = [
    {
      title: 'Total Personnel',
      value: staff?.length || 0,
      sub: 'Active Team Members',
      icon: Users,
      color: 'text-blue-600',
      bgBase: 'bg-blue-500/10'
    },
    {
      title: 'Pending Leave',
      value: pendingLeave?.length || 0,
      sub: 'Action Required',
      icon: Palmtree,
      color: 'text-amber-600',
      bgBase: 'bg-amber-500/10'
    },
    {
      title: 'Utilization',
      value: '92%',
      sub: 'Resource Efficiency',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgBase: 'bg-emerald-500/10'
    },
    {
      title: 'Hiring Pipeline',
      value: 3,
      sub: 'Active Vacancies',
      icon: UserPlus,
      color: 'text-primary',
      bgBase: 'bg-primary/10'
    }
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
          <div className="space-y-1">
              <h1 className="text-4xl font-black text-omuto-navy uppercase tracking-tight">HR Terminal</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" /> Administrative Workforce Control
              </p>
          </div>
          <Button asChild className="btn-omuto shadow-comic-sm h-12 rounded-xl">
              <Link href="/management/users"><UserPlus className="mr-2 h-4 w-4" /> Add Personnel</Link>
          </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
              <Card key={i} className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                  <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl ${m.bgBase} ${m.color}`}><m.icon className="h-6 w-6" /></div>
                          <ArrowUpRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-4xl font-black text-omuto-navy tracking-tight">{m.value}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{m.title}</p>
                      <p className="text-[9px] font-bold text-muted-foreground/40 uppercase mt-4">{m.sub}</p>
                  </CardContent>
              </Card>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Pending Leave Column */}
          <Card className="lg:col-span-8 border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                      <div>
                          <CardTitle className="text-xl font-black uppercase tracking-tight text-omuto-navy">Leave Approval Queue</CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Requests requiring immediate attention</CardDescription>
                      </div>
                      <Button asChild variant="ghost" className="text-primary font-black uppercase tracking-widest text-[9px] hover:bg-primary/5">
                          <Link href="/hr/leave">View All Terminal →</Link>
                      </Button>
                  </div>
              </CardHeader>
              <CardContent className="p-0">
                  {isLoadingLeave ? (
                      <div className="p-8 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
                  ) : pendingLeave && pendingLeave.length > 0 ? (
                      <div className="divide-y divide-omuto-navy/5">
                          {pendingLeave.map((req: any) => (
                              <div key={req.id} className="p-8 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                  <div className="flex items-center gap-4">
                                      <div className="h-10 w-10 rounded-full bg-omuto-navy/5 flex items-center justify-center font-bold text-omuto-navy uppercase text-xs">
                                          {req.userName?.[0] || 'U'}
                                      </div>
                                      <div>
                                          <p className="text-sm font-black text-omuto-navy uppercase tracking-tight">{req.userName}</p>
                                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{req.type} Leave — {req.days} days</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Button asChild variant="outline" size="sm" className="h-9 px-4 rounded-xl font-bold uppercase tracking-widest text-[9px] border-2">
                                          <Link href="/hr/leave">Review Application</Link>
                                      </Button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="py-20 text-center text-muted-foreground/30">
                          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Queue is currently clear.</p>
                      </div>
                  )}
              </CardContent>
          </Card>

          {/* HR Radar / Quick Tasks */}
          <Card className="lg:col-span-4 border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-lg font-black uppercase tracking-tight text-omuto-navy flex items-center gap-2">
                       <Sparkles className="h-5 w-5 text-primary" /> Personnel Radar
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                  <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-amber-500/5 border-2 border-amber-500/10 flex items-start gap-3">
                          <Timer className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                              <p className="text-[10px] font-black text-omuto-navy uppercase tracking-tight">Performance Reviews</p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed mt-0.5">4 team members are due for their quarterly evaluation.</p>
                          </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/10 flex items-start gap-3">
                          <FileBadge className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                              <p className="text-[10px] font-black text-omuto-navy uppercase tracking-tight">Contract Renewal</p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed mt-0.5">Grace Okello's contract expires in 14 days.</p>
                          </div>
                      </div>

                      <Button asChild variant="ghost" className="w-full justify-between h-14 rounded-2xl bg-omuto-navy text-white hover:bg-omuto-navy/90 border-none group transition-all">
                        <Link href="/hr/payroll" className="flex items-center">
                            <CreditCard className="mr-3 h-5 w-5 text-primary" />
                            <span className="font-black uppercase tracking-widest text-[10px]">Process Payroll</span>
                            <ArrowUpRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </Link>
                    </Button>
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
