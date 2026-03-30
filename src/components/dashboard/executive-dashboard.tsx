
'use client';

import { DashboardHeader } from "./dashboard-header"
import type { DashboardProps } from "./dashboard-loader"
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { DashboardSection, CompactStatCard } from './dashboard-section';
import { NotificationsWidget } from './notifications-widget';
import { TeamDeployment } from './team-deployment';
import { TeamPerformanceLeaderboard } from './team-performance-leaderboard';
import { ApprovalQueue } from './approval-queue';
import { EcosystemPulse } from './ecosystem-pulse';
import { GrantDeadlineAlert } from './grant-deadline-alert';
import dynamic from 'next/dynamic';

const ProgramHealthScore = dynamic(() => import('@/components/dashboard/program-health-score').then(mod => mod.ProgramHealthScore), {
  loading: () => <Card className="h-64"><CardContent className="p-4 flex items-center justify-center">Loading program health...</CardContent></Card>,
  ssr: false,
});

const DashboardCalendar = dynamic(() => import('@/components/dashboard/dashboard-calendar').then(mod => mod.DashboardCalendar), {
  loading: () => <Card className="h-64"><CardContent className="p-4 flex items-center justify-center">Loading calendar...</CardContent></Card>,
  ssr: false,
});

import { 
  TrendingUp, DollarSign, Wallet, Clock, Activity, 
  Users, AlertTriangle, BarChart3, ClipboardCheck, Target,
  Heart, GraduationCap, Calendar
} from 'lucide-react';
import Link from 'next/link';

export function ExecutiveDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const monthStart = useMemo(() => {
    if (!mounted) return new Date(0);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, [mounted]);
  
  const expensesQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc'), limit(50)) : null
  , [firestore]);
  const { data: expenses } = useCollection(expensesQuery);

  const incomeQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc'), limit(50)) : null
  , [firestore]);
  const { data: income } = useCollection(incomeQuery);

  const schoolsQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'sx-schools'), limit(50)) : null
  , [firestore]);
  const { data: schools } = useCollection(schoolsQuery);

  const thisMonthExpenses = useMemo(() => {
    if (!expenses || !mounted) return 0;
    const now = new Date();
    return expenses
      .filter(e => {
        const created = e.createdAt?.toDate?.() || new Date(e.createdAt?.seconds ? e.createdAt.seconds * 1000 : now.getTime());
        return created >= monthStart && e.status !== 'Rejected';
      })
      .reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);
  }, [expenses, monthStart, mounted]);

  const thisMonthIncome = useMemo(() => {
    if (!income || !mounted) return 0;
    const now = new Date();
    return income
      .filter(i => {
        const received = i.dateReceived?.toDate?.() || new Date(i.dateReceived?.seconds ? i.dateReceived.seconds * 1000 : now.getTime());
        return received >= monthStart;
      })
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  }, [income, monthStart]);

  const pendingApprovals = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => e.status === 'Pending').slice(0, 5);
  }, [expenses]);

  const approvedNotDisbursed = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => e.status === 'Approved').slice(0, 5);
  }, [expenses]);

  const balance = thisMonthIncome - thisMonthExpenses;
  const totalSchools = schools?.length || 0;
  const activeSchools = schools?.filter(s => s.status === 'Active').length || 0;

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader profile={profile} />
      
      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <CompactStatCard 
          label="Income (MTD)" 
          value={formatCurrency(thisMonthIncome, true)} 
          icon={DollarSign} 
          color="bg-green-500"
          href="/finance/income"
        />
        <CompactStatCard 
          label="Expenses (MTD)" 
          value={formatCurrency(thisMonthExpenses, true)} 
          icon={Wallet} 
          color="bg-red-500"
          href="/finance/requisitions"
        />
        <CompactStatCard 
          label="Net" 
          value={formatCurrency(balance, true)} 
          icon={TrendingUp} 
          color={balance >= 0 ? "bg-green-500" : "bg-red-500"}
        />
        <CompactStatCard 
          label="Pending" 
          value={pendingApprovals.length} 
          icon={Clock} 
          color={pendingApprovals.length > 0 ? "bg-amber-500" : "bg-green-500"}
          href="/finance/requisitions?status=Pending"
        />
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Primary Content */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Pending Approvals Alert */}
          {pendingApprovals.length > 0 && (
            <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-bold">{pendingApprovals.length} pending approvals</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/finance/requisitions?status=Pending">Review</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schools Overview */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="py-3">
              <CardContent className="p-0 text-center">
                <GraduationCap className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                <p className="text-xl font-black">{totalSchools}</p>
                <p className="text-[10px] uppercase text-muted-foreground">Schools</p>
              </CardContent>
            </Card>
            <Card className="py-3">
              <CardContent className="p-0 text-center">
                <Heart className="h-5 w-5 mx-auto text-pink-500 mb-1" />
                <p className="text-xl font-black">{activeSchools}</p>
                <p className="text-[10px] uppercase text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card className="py-3">
              <CardContent className="p-0 text-center">
                <Activity className="h-5 w-5 mx-auto text-green-500 mb-1" />
                <p className="text-xl font-black">{Math.round((activeSchools / (totalSchools || 1)) * 100)}%</p>
                <p className="text-[10px] uppercase text-muted-foreground">Active Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <DashboardSection title="Quick Actions" icon={Target} defaultOpen={true}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button asChild size="sm" className="h-auto py-2 bg-omuto-navy">
                <Link href="/forms/expense" className="flex flex-col items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-bold">Requisition</span>
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-auto py-2">
                <Link href="/finance/income" className="flex flex-col items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-bold">Income</span>
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-auto py-2">
                <Link href="/school-xperience/log-visit" className="flex flex-col items-center gap-1">
                  <ClipboardCheck className="h-4 w-4" />
                  <span className="text-xs font-bold">Log Visit</span>
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-auto py-2">
                <Link href="/finance/reports" className="flex flex-col items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs font-bold">Reports</span>
                </Link>
              </Button>
            </div>
          </DashboardSection>

          {/* Team Deployment - Live */}
          <TeamDeployment />

          {/* Team Performance Leaderboard */}
          <TeamPerformanceLeaderboard />

          {/* Program Health Score */}
          <ProgramHealthScore />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4">
          {/* Role Mission */}
          <Card className="bg-omuto-navy text-white">
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase opacity-60 mb-1">Your Focus</p>
              <p className="text-sm font-semibold">
                Strategic leadership, partnerships, and organizational impact
              </p>
            </CardContent>
          </Card>

          {/* Action Items */}
          <DashboardSection 
            title="Action Items" 
            icon={Clock} 
            badge={`${pendingApprovals.length + approvedNotDisbursed.length}`}
            badgeColor={pendingApprovals.length > 0 ? 'red' : 'green'}
            defaultOpen={true}
          >
            <div className="space-y-2">
              {pendingApprovals.length > 0 && (
                <div className="flex items-center justify-between p-2 rounded bg-amber-50 border">
                  <span className="text-sm">Pending Approval</span>
                  <span className="font-bold text-amber-600">{pendingApprovals.length}</span>
                </div>
              )}
              {approvedNotDisbursed.length > 0 && (
                <div className="flex items-center justify-between p-2 rounded bg-blue-50 border">
                  <span className="text-sm">Ready for Disbursement</span>
                  <span className="font-bold text-blue-600">{approvedNotDisbursed.length}</span>
                </div>
              )}
              {pendingApprovals.length === 0 && approvedNotDisbursed.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">All caught up!</p>
              )}
            </div>
          </DashboardSection>

          {/* Notifications */}
          <NotificationsWidget />

          {/* Grant Deadlines */}
          <GrantDeadlineAlert />

          {/* Calendar Preview */}
          <DashboardCalendar />
        </div>
      </div>
    </div>
  );
}
