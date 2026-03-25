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
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function SelfServicePage() {
  const { user } = useUser();
  const { profile, isLoading } = useUserProfile(user);

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Profile Snapshot */}
        <div className="lg:col-span-4 space-y-6">
            <Card className="border-2 border-omuto-navy/10 bg-white rounded-[2.5rem] shadow-xl overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-24 bg-omuto-navy/5 -z-1" />
                <CardContent className="p-8 pt-10 text-center">
                    <Avatar className="h-24 w-24 mx-auto border-4 border-white shadow-xl mb-4 group-hover:scale-105 transition-transform duration-300">
                        {profile?.photoURL && <AvatarImage src={profile.photoURL} />}
                        <AvatarFallback className="text-2xl font-black bg-omuto-navy text-white">{getInitials(profile?.name)}</AvatarFallback>
                    </Avatar>
                    
                    {isLoading ? (
                        <div className="space-y-2 flex flex-col items-center">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    ) : (
                        <>
                            <h3 className="text-xl font-black text-omuto-navy uppercase tracking-tight">{profile?.name || 'Omuto Member'}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">{profile?.role || 'Team Member'}</p>
                            <p className="text-xs text-muted-foreground mt-4 leading-relaxed px-4 italic opacity-70">
                                "Empowering the next generation with purpose and passion."
                            </p>
                        </>
                    )}

                    <div className="mt-8 pt-8 border-t border-omuto-navy/5 grid grid-cols-2 gap-4">
                        <div className="text-left">
                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Joined</p>
                            <p className="text-xs font-bold text-omuto-navy">{user?.metadata.creationTime ? new Date(user.metadata.creationTime).getFullYear() : '2025'}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
                             <p className="text-xs font-bold text-emerald-600">Active</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions Terminal */}
            <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-omuto-navy text-white">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-lg font-black uppercase tracking-tight">Active Terminal</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-3">
                    <Button asChild variant="ghost" className="w-full justify-between h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white border-none group transition-all">
                        <Link href="/forms/check-in" className="flex items-center">
                            <Clock className="mr-3 h-5 w-5 text-omuto-red" />
                            <span className="font-black uppercase tracking-widest text-[10px]">Staff Check-in</span>
                            <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-between h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white border-none group transition-all">
                        <Link href="/self-service/leave" className="flex items-center">
                            <Palmtree className="mr-3 h-5 w-5 text-emerald-400" />
                            <span className="font-black uppercase tracking-widest text-[10px]">Request Leave</span>
                            <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-between h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white border-none group transition-all">
                        <Link href="/chat" className="flex items-center">
                            <Bot className="mr-3 h-5 w-5 text-blue-400" />
                            <span className="font-black uppercase tracking-widest text-[10px]">Ask Dumo AI</span>
                            <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* Dynamic Sections */}
        <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                {/* Leave Balance Card */}
                <Card className="border-2 border-emerald-500/20 bg-emerald-500/5 rounded-[2.5rem] shadow-xl overflow-hidden group">
                    <CardContent className="p-8 pb-6 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-600"><Palmtree className="h-6 w-6" /></div>
                                <Badge className="bg-emerald-600 text-white border-none rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest">Available</Badge>
                            </div>
                            <p className="text-4xl font-black text-emerald-700 tracking-tight leading-none mb-1">18 Days</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/50">Annual Leave Balance</p>
                        </div>
                        <Button asChild variant="link" className="p-0 h-auto text-emerald-700 mt-8 font-black uppercase tracking-widest text-[9px] w-fit hover:no-underline hover:text-emerald-900">
                            <Link href="/self-service/leave">Manage Leave <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Performance Snapshot */}
                <Card className="border-2 border-primary/20 bg-primary/5 rounded-[2.5rem] shadow-xl overflow-hidden group">
                    <CardContent className="p-8 pb-6 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-3 bg-primary/20 rounded-2xl text-primary"><Sparkles className="h-6 w-6" /></div>
                                <Badge className="bg-primary text-white border-none rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest">Mastery</Badge>
                            </div>
                            <p className="text-4xl font-black text-primary tracking-tight leading-none mb-1">94%</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">Engagement Score</p>
                        </div>
                        <Button asChild variant="link" className="p-0 h-auto text-primary mt-8 font-black uppercase tracking-widest text-[9px] w-fit hover:no-underline hover:text-omuto-navy">
                            <Link href="/self-service/performance">View Metrics <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* My Assets Snapshot */}
                <Card className="border-2 border-blue-500/20 bg-blue-500/5 rounded-[2.5rem] shadow-xl overflow-hidden group">
                    <CardContent className="p-8 pb-6 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-600"><Briefcase className="h-6 w-6" /></div>
                                <Badge className="bg-blue-600 text-white border-none rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest">Secured</Badge>
                            </div>
                            <p className="text-4xl font-black text-blue-700 tracking-tight leading-none mb-1">3 Items</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/50">Assigned Equipment</p>
                        </div>
                        <Button asChild variant="link" className="p-0 h-auto text-blue-700 mt-8 font-black uppercase tracking-widest text-[9px] w-fit hover:no-underline hover:text-blue-900">
                            <Link href="/self-service/assets">Asset Registry <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Latest Payslip Snapshot */}
                <Card className="border-2 border-amber-500/20 bg-amber-500/5 rounded-[2.5rem] shadow-xl overflow-hidden group">
                    <CardContent className="p-8 pb-6 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-600"><Wallet className="h-6 w-6" /></div>
                                <Badge className="bg-amber-600 text-white border-none rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest">Verified</Badge>
                            </div>
                            <p className="text-4xl font-black text-amber-700 tracking-tight leading-none mb-1">Feb '26</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/50">Latest Payslip Issued</p>
                        </div>
                        <Button asChild variant="link" className="p-0 h-auto text-amber-700 mt-8 font-black uppercase tracking-widest text-[9px] w-fit hover:no-underline hover:text-amber-900">
                            <Link href="/self-service/payslips">View Payroll <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* My Recent Activity / Notifications */}
            <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black uppercase tracking-tight text-omuto-navy">Personal Feed</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Updates from your department and system alerts</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-omuto-navy/5 text-omuto-navy/40"><Target className="h-5 w-5" /></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-omuto-navy/5">
                        <div className="p-8 flex items-start gap-4 hover:bg-muted/10 transition-colors">
                            <div className="h-10 w-10 rounded-xl bg-omuto-red/10 border-2 border-omuto-red/20 flex items-center justify-center flex-shrink-0">
                                <FileText className="h-5 w-5 text-omuto-red" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs font-black text-omuto-navy uppercase tracking-tight">Finance Update</p>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">2h ago</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">Your requisition for 'Youth Workshop Materials' has been <span className="text-emerald-600 font-bold">Approved</span> by the ED.</p>
                            </div>
                        </div>

                        <div className="p-8 flex items-start gap-4 hover:bg-muted/10 transition-colors">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <Timer className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs font-black text-omuto-navy uppercase tracking-tight">System Reminder</p>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Yesterday</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">Don't forget to complete your weekly mission report before Friday 5:00 PM.</p>
                            </div>
                        </div>

                        <div className="p-8 flex items-start gap-4 hover:bg-muted/10 transition-colors opacity-60">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center flex-shrink-0">
                                <Palmtree className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs font-black text-omuto-navy uppercase tracking-tight">HR Notification</p>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">2 days ago</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">Annual Leave policy for 2025 has been updated in the Knowledge Hub.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-8 bg-muted/20 border-t text-center">
                        <Button variant="link" asChild className="text-[10px] font-black uppercase tracking-widest text-primary p-0 h-auto">
                            <Link href="/notifications">Manage All Notifications →</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)} {...props}>
      {children}
    </div>
  );
}
