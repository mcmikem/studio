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
      bgBase: 'bg-blue-50'
    },
    {
      title: 'Pending Leave',
      value: pendingLeave?.length || 0,
      sub: 'Action Required',
      icon: Palmtree,
      color: 'text-amber-600',
      bgBase: 'bg-amber-50'
    },
    {
      title: 'Utilization',
      value: '--%',
      sub: 'Resource Efficiency',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgBase: 'bg-emerald-50'
    },
    {
      title: 'Hiring Pipeline',
      value: 0,
      sub: 'Active Vacancies',
      icon: UserPlus,
      color: 'text-primary',
      bgBase: 'bg-primary/5'
    }
  ];

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="HR Dashboard"
        description="Administrative workforce control and personnel oversight."
        icon={LayoutDashboard}
      >
        <Button asChild className="btn-omuto shadow-sm">
            <Link href="/management/users"><UserPlus className="mr-2 h-4 w-4" /> Add Personnel</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
              <Card key={i} className="border shadow-sm hover:shadow-md transition-shadow cursor-default">
                  <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                          <div className={`p-2.5 rounded-xl ${m.bgBase} ${m.color}`}><m.icon className="h-5 w-5" /></div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground/30" />
                      </div>
                      <p className="text-2xl font-bold text-omuto-navy tracking-tight">{m.value}</p>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{m.title}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-4 font-medium uppercase">{m.sub}</p>
                  </CardContent>
              </Card>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Pending Leave Column */}
          <Card className="lg:col-span-8 border shadow-sm">
              <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        Leave Approval Queue
                      </CardTitle>
                      <Button asChild variant="ghost" size="sm" className="text-primary font-bold text-xs hover:bg-primary/5">
                          <Link href="/hr/leave">View All →</Link>
                      </Button>
                  </div>
              </CardHeader>
              <CardContent className="p-0">
                  {isLoadingLeave ? (
                      <div className="p-6 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
                  ) : pendingLeave && pendingLeave.length > 0 ? (
                      <div className="divide-y border-t">
                          {pendingLeave.map((req: any) => (
                              <div key={req.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                  <div className="flex items-center gap-4">
                                      <div className="h-10 w-10 rounded-full bg-omuto-navy/5 flex items-center justify-center font-bold text-omuto-navy uppercase text-xs">
                                          {req.userName?.[0] || 'U'}
                                      </div>
                                      <div>
                                          <p className="text-sm font-bold text-omuto-navy">{req.userName}</p>
                                          <p className="text-xs text-muted-foreground">{req.type} Leave · {req.days} days</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Button asChild variant="outline" size="sm" className="h-8 font-bold text-[11px] uppercase tracking-wider">
                                          <Link href="/hr/leave">Review</Link>
                                      </Button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="py-20 text-center text-muted-foreground/30 border-t">
                          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p className="text-xs font-bold uppercase tracking-wider">Queue is clear.</p>
                      </div>
                  )}
              </CardContent>
          </Card>

          {/* HR Radar / Quick Tasks */}
          <Card className="lg:col-span-4 border shadow-sm bg-white">
              <CardHeader className="pb-4">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                       <Sparkles className="h-4 w-4 text-primary" /> Personnel Radar
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-muted/20 border border-muted/20 flex flex-col items-center justify-center text-center py-10 opacity-60">
                          <Timer className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-[10px] font-bold text-omuto-navy uppercase tracking-widest">No Active Radar Alerts</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed mt-1 px-4">Performance reviews and contract signals will appear here.</p>
                      </div>

                      <Button asChild className="w-full justify-between h-12 rounded-xl bg-omuto-navy text-white hover:bg-omuto-navy/90 border-none group transition-all mt-4">
                        <Link href="/hr/payroll" className="flex items-center w-full">
                            <CreditCard className="mr-3 h-4 w-4 text-primary" />
                            <span className="font-bold uppercase tracking-widest text-[10px]">Process Payroll</span>
                            <ArrowUpRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                        </Link>
                    </Button>
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
