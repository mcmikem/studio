'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { 
  UserCircle, Palmtree, Timer, Wallet, Sparkles, 
  ArrowRight, ShieldCheck, Clock, CheckCircle2,
  Calendar, Briefcase, FileText, Bot, Target
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

export default function SelfServicePage() {
  const { user } = useUser();
  const { profile, isLoading } = useUserProfile(user);
  const firestore = useFirestore();

  const leaveQuery = useMemoFirebase(() => 
    firestore && user ? query(collection(firestore, 'leave-requests'), where('userId', '==', user.uid)) : null
  , [firestore, user]);
  const { data: leaveRequests, isLoading: isLoadingLeave } = useCollection(leaveQuery);

  const leaveBalance = React.useMemo(() => {
    if (!leaveRequests) return null;
    const ANNUAL_ENTITLEMENT = 21;
    const usedDays = leaveRequests
      .filter((l: any) => l.status === 'Approved')
      .reduce((sum: number, l: any) => {
        const start = l.startDate?.toDate?.() || new Date(l.startDate);
        const end = l.endDate?.toDate?.() || new Date(l.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return sum + Math.max(0, days);
      }, 0);
    return Math.max(0, ANNUAL_ENTITLEMENT - usedDays);
  }, [leaveRequests]);

  const assetsQuery = useMemoFirebase(() => 
    firestore && user ? query(collection(firestore, 'assets'), where('assignedToId', '==', user.uid)) : null
  , [firestore, user]);
  const { data: assets, isLoading: isLoadingAssets } = useCollection(assetsQuery);

  const alertsQuery = useMemoFirebase(() => 
    firestore && user ? query(collection(firestore, 'alerts'), where('targetUserIds', 'array-contains', user.uid), orderBy('createdAt', 'desc'), limit(5)) : null
  , [firestore, user]);
  const { data: alerts, isLoading: isLoadingAlerts } = useCollection(alertsQuery);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="My Hub"
        description="Your personal terminal for leave, attendance, and performance."
        icon={UserCircle}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Snapshot */}
        <div className="lg:col-span-4 space-y-6">
            <Card className="border shadow-sm overflow-hidden bg-card">
                <CardContent className="p-8 text-center">
                    <Avatar className="h-20 w-20 mx-auto border-2 border-primary mb-4">
                        {profile?.photoURL && <AvatarImage src={profile.photoURL} />}
                        <AvatarFallback className="text-xl font-bold bg-omuto-navy text-white">{getInitials(profile?.name)}</AvatarFallback>
                    </Avatar>
                    
                    {isLoading ? (
                        <div className="space-y-2 flex flex-col items-center">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold text-omuto-navy tracking-tight">{profile?.name || 'Omuto Member'}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mt-1">{profile?.role || 'Team Member'}</p>
                            <p className="text-xs text-muted-foreground mt-4 leading-relaxed px-4">
                                {profile?.role ? `${profile.role} at Omuto Foundation` : 'Team Member at Omuto Foundation'}
                            </p>
                        </>
                    )}

                    <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
                        <div className="text-left">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Joined</p>
                            <p className="text-sm font-semibold text-omuto-navy">{user?.metadata.creationTime ? new Date(user.metadata.creationTime).getFullYear() : '2025'}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</p>
                             <p className="text-sm font-semibold text-emerald-600">Active</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions Terminal */}
            <Card className="border shadow-md overflow-hidden bg-omuto-navy text-white">
                <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-base font-bold uppercase tracking-tight">Active Terminal</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                    <Button asChild variant="ghost" className="w-full justify-start h-12 rounded-xl bg-card/5 hover:bg-card/10 text-white border-none group transition-all">
                        <Link href="/forms/check-in" className="flex items-center w-full">
                            <Clock className="mr-3 h-4 w-4 text-omuto-red" />
                            <span className="font-bold uppercase tracking-wider text-[11px]">Staff Check-in</span>
                            <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start h-12 rounded-xl bg-card/5 hover:bg-card/10 text-white border-none group transition-all">
                        <Link href="/self-service/leave" className="flex items-center w-full">
                            <Palmtree className="mr-3 h-4 w-4 text-emerald-400" />
                            <span className="font-bold uppercase tracking-wider text-[11px]">Request Leave</span>
                            <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start h-12 rounded-xl bg-card/5 hover:bg-card/10 text-white border-none group transition-all">
                        <Link href="/chat" className="flex items-center w-full">
                            <Bot className="mr-3 h-4 w-4 text-blue-400" />
                            <span className="font-bold uppercase tracking-wider text-[11px]">Ask Omuto AI</span>
                            <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* Dynamic Sections */}
        <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Leave Balance Card */}
                <Card className="border shadow-sm group hover:shadow-md transition-shadow text-left">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600"><Palmtree className="h-5 w-5" /></div>
                                <Badge className="bg-emerald-600 text-white border-none text-[10px] font-bold uppercase tracking-wider">
                                    {isLoadingLeave ? '...' : 'Available'}
                                </Badge>
                            </div>
                            <p className="text-3xl font-bold text-omuto-navy tracking-tight leading-none mb-1">
                                {isLoadingLeave ? <Skeleton className="h-8 w-20" /> : `${leaveBalance ?? 21} Days`}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Annual Leave Balance</p>
                        </div>
                        <Button asChild variant="link" className="p-0 h-auto text-primary mt-6 font-bold uppercase tracking-wider text-[10px] w-fit hover:no-underline">
                            <Link href="/self-service/leave">Manage Leave <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Performance Snapshot */}
                <Card className="border shadow-sm group hover:shadow-md transition-shadow text-left">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 bg-primary/5 rounded-xl text-primary"><Sparkles className="h-5 w-5" /></div>
                                <Badge className="bg-primary text-white border-none text-[10px] font-bold uppercase tracking-wider">Mastery</Badge>
                            </div>
                            <p className="text-3xl font-bold text-omuto-navy tracking-tight leading-none mb-1">--%</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Engagement Score</p>
                        </div>
                        <Button asChild variant="link" className="p-0 h-auto text-primary mt-6 font-bold uppercase tracking-wider text-[10px] w-fit hover:no-underline">
                            <Link href="/self-service/performance">View Metrics <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* My Assets Snapshot */}
                <Card className="border shadow-sm group hover:shadow-md transition-shadow text-left">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><Briefcase className="h-5 w-5" /></div>
                                <Badge className="bg-blue-600 text-white border-none text-[10px] font-bold uppercase tracking-wider">
                                    {isLoadingAssets ? '...' : 'Secured'}
                                </Badge>
                            </div>
                            <p className="text-3xl font-bold text-omuto-navy tracking-tight leading-none mb-1">
                                {isLoadingAssets ? <Skeleton className="h-8 w-16" /> : `${assets?.length || 0} Items`}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assigned Equipment</p>
                        </div>
                        <Button asChild variant="link" className="p-0 h-auto text-primary mt-6 font-bold uppercase tracking-wider text-[10px] w-fit hover:no-underline">
                            <Link href="/self-service/assets">Asset Registry <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Latest Payslip Snapshot */}
                <Card className="border shadow-sm group hover:shadow-md transition-shadow text-left">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600"><Wallet className="h-5 w-5" /></div>
                                <Badge className="bg-amber-600 text-white border-none text-[10px] font-bold uppercase tracking-wider">Payroll</Badge>
                            </div>
                            <p className="text-3xl font-bold text-omuto-navy tracking-tight leading-none mb-1">--</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Latest Payslip Issued</p>
                        </div>
                        <Button asChild variant="link" className="p-0 h-auto text-primary mt-6 font-bold uppercase tracking-wider text-[10px] w-fit hover:no-underline">
                            <Link href="/self-service/payslips">View Payroll <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* My Recent Activity / Notifications */}
            <Card className="border shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" />
                                Personal Feed
                            </CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden text-left">
                    <div className="divide-y border-t">
                        {isLoadingAlerts ? (
                             <div className="p-6 space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                             </div>
                        ) : alerts && alerts.length > 0 ? (
                            alerts.map((alert: any) => (
                                <div key={alert.id} className="p-6 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                                    <div className="h-9 w-9 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-bold text-omuto-navy uppercase tracking-tight">{alert.type || 'Notification'}</p>
                                            <span className="text-[10px] text-muted-foreground uppercase opacity-60">
                                                {formatDateSafe(alert.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{alert.message}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center py-20 opacity-40">
                                <div className="flex justify-center mb-4"><CheckCircle2 className="h-12 w-12 text-muted-foreground" /></div>
                                <p className="text-[10px] font-bold text-omuto-navy uppercase tracking-widest">Feed is clean.</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Institutional alerts will appear here.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}


