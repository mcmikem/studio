
'use client';

import { DashboardHeader } from "./dashboard-header"
import { RoleMissionCard } from "./role-mission-card"
import type { DashboardProps } from "./dashboard-loader"
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { TeamDeployment } from './team-deployment';
import { TeamPerformanceLeaderboard } from './team-performance-leaderboard';
import { ApprovalQueue } from './approval-queue';
import { EcosystemPulse } from './ecosystem-pulse';
import { 
  TrendingUp, DollarSign, Wallet, Clock, Activity, CheckCircle,
  Users, AlertTriangle, BarChart3, ClipboardCheck, Target,
  Heart, GraduationCap, TreePine, Droplets
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function ExecutiveDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Expenses
  const expensesQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc'), limit(50)) : null
  , [firestore]);
  const { data: expenses, isLoading: expensesLoading } = useCollection(expensesQuery);

  // Income
  const incomeQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'income'), orderBy('createdAt', 'desc'), limit(50)) : null
  , [firestore]);
  const { data: income, isLoading: incomeLoading } = useCollection(incomeQuery);

  // Schools for program health
  const schoolsQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'schools'), orderBy('createdAt', 'desc'), limit(100)) : null
  , [firestore]);
  const { data: schools } = useCollection(schoolsQuery);

  // Tree surveys (GreenSchools)
  const treeSurveysQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'tree-surveys'), limit(100)) : null
  , [firestore]);
  const { data: treeSurveys } = useCollection(treeSurveysQuery);

  // Water sources (PureWater)
  const waterSourcesQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'water-sources'), limit(100)) : null
  , [firestore]);
  const { data: waterSources } = useCollection(waterSourcesQuery);

  // This month calculations - show all expenses submitted this month (including Pending)
  // Rejected expenses are excluded from calculations
  const thisMonthExpenses = useMemo(() => {
    if (!expenses) return 0;
    return expenses
      .filter(e => {
        const created = e.createdAt?.toDate?.() || new Date(e.createdAt?.seconds ? e.createdAt.seconds * 1000 : Date.now());
        // Include all submitted expenses (Pending, Approved, Disbursed) but exclude Rejected
        return created >= monthStart && e.status !== 'Rejected';
      })
      .reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);
  }, [expenses, monthStart]);

  // This month income - show all income recorded this month (no approval needed)
  const thisMonthIncome = useMemo(() => {
    if (!income) return 0;
    return income
      .filter(i => {
        // Income uses dateReceived for the actual date
        const received = i.dateReceived?.toDate?.() || new Date(i.dateReceived?.seconds ? i.dateReceived.seconds * 1000 : Date.now());
        return received >= monthStart;
      })
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  }, [income, monthStart]);

  // Pending approvals (waiting for ED to approve)
  const pendingApprovals = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => e.status === 'Pending').slice(0, 5);
  }, [expenses]);

  // Approved but not disbursed (waiting for Finance to disburse)
  const approvedNotDisbursed = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => e.status === 'Approved').slice(0, 5);
  }, [expenses]);

  const balance = thisMonthIncome - thisMonthExpenses;

  // Program stats
  const totalSchools = schools?.length || 0;
  const activeSchools = schools?.filter(s => s.status === 'Active').length || 0;
  const totalTrees = treeSurveys?.reduce((sum, s) => sum + (s.numberOfTreesSurvived || s.totalTreesAtPlanting || 0), 0) || 0;
  const totalWaterPoints = waterSources?.length || 0;

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      
      {/* This Month Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard title="Income (MTD)" value={formatCurrency(thisMonthIncome, true)} icon={DollarSign} iconBg="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600" href="/finance/income" />
        <StatCard title="Expenses (MTD)" value={formatCurrency(thisMonthExpenses, true)} icon={Wallet} iconBg="bg-red-100 dark:bg-red-900/30" iconColor="text-red-600" href="/finance/requisitions" />
        <StatCard title="Net (MTD)" value={formatCurrency(balance, true)} change={balance >= 0 ? 'On track' : 'Over'} changeType={balance >= 0 ? 'positive' : 'negative'} icon={TrendingUp} iconBg={balance >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} iconColor={balance >= 0 ? 'text-green-600' : 'text-red-600'} />
        <StatCard title="Pending" value={pendingApprovals.length.toString()} change={pendingApprovals.length > 0 ? 'Needs review' : 'All clear'} changeType={pendingApprovals.length > 0 ? 'warning' : 'positive'} icon={Clock} iconBg="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600" href="/finance/requisitions?status=Pending" />
      </div>

      {/* Pending Approvals - ED Review */}
      {pendingApprovals.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Pending Your Approval ({pendingApprovals.length})
              </h3>
              <Button variant="outline" size="sm" asChild><Link href="/finance/requisitions?status=Pending">View All</Link></Button>
            </div>
            <div className="space-y-2">
              {pendingApprovals.slice(0, 4).map(expense => {
                const createdAt = expense.createdAt?.toDate?.() || new Date();
                const days = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={expense.id} className="flex items-center justify-between p-2 rounded-lg bg-card dark:bg-card border border-amber-200 dark:border-amber-800">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-omuto-navy dark:text-foreground truncate">{expense.title}</p>
                      <p className="text-xs text-muted-foreground">{expense.userName || 'Unknown'} · {days}d</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-bold">{formatCurrency(expense.totalAmount, true)}</p>
                      <Button asChild size="sm" variant="ghost" className="h-10 sm:h-6 text-[10px] font-bold text-primary"><Link href={`/finance/requisitions?id=${expense.id}`}>Review</Link></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approved - Waiting for Disbursement */}
      {approvedNotDisbursed.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                Approved - Ready for Disbursement ({approvedNotDisbursed.length})
              </h3>
              <Button variant="outline" size="sm" asChild><Link href="/finance/requisitions?status=Approved">View All</Link></Button>
            </div>
            <div className="space-y-2">
              {approvedNotDisbursed.slice(0, 3).map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-2 rounded-lg bg-card dark:bg-card border border-blue-200 dark:border-blue-800">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{expense.title}</p>
                    <p className="text-xs text-muted-foreground">{expense.userName || 'Unknown'}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-bold">{formatCurrency(expense.totalAmount, true)}</p>
                    <Button asChild size="sm" variant="ghost" className="h-10 sm:h-6 text-[10px] font-bold text-blue-600"><Link href={`/finance/requisitions?id=${expense.id}`}>Disburse</Link></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Program Health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><GraduationCap className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-black">{totalSchools}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase">Schools</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30"><Heart className="h-5 w-5 text-pink-600" /></div>
              <div>
                <p className="text-2xl font-black">{activeSchools}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><TreePine className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-black">{totalTrees > 0 ? totalTrees.toLocaleString() : '-'}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase">Trees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30"><Droplets className="h-5 w-5 text-cyan-600" /></div>
              <div>
                <p className="text-2xl font-black">{totalWaterPoints > 0 ? totalWaterPoints : '-'}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase">Water Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-blue-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button asChild className="w-full justify-start h-auto py-3 px-3 bg-omuto-navy">
              <Link href="/forms/expense" className="flex flex-col items-center gap-1">
                <DollarSign className="h-5 w-5" />
                <span className="text-xs font-bold">Requisition</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-auto py-3 px-3">
              <Link href="/finance/income" className="flex flex-col items-center gap-1">
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs font-bold">Income</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-auto py-3 px-3">
              <Link href="/school-xperience/log-visit" className="flex flex-col items-center gap-1">
                <ClipboardCheck className="h-5 w-5" />
                <span className="text-xs font-bold">Log Visit</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-auto py-3 px-3">
              <Link href="/finance/reports" className="flex flex-col items-center gap-1">
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs font-bold">Reports</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <RoleMissionCard profile={profile} />

      {/* Team Deployment - shows field staff status */}
      <TeamDeployment />

      {/* Team Performance Leaderboard */}
      <TeamPerformanceLeaderboard />

      {/* Approval Queue - pending expenses */}
      <ApprovalQueue />

      {/* Ecosystem Pulse - program health overview */}
      <EcosystemPulse />
    </div>
  );
}

function StatCard({ title, value, change, changeType, icon: Icon, iconBg, iconColor, href }: {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'warning';
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  href?: string;
}) {
  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-lg sm:text-xl font-black">{value}</p>
            {change && (
              <p className={`text-[10px] sm:text-[10px] font-semibold ${
                changeType === 'positive' ? 'text-green-600' : 
                changeType === 'negative' ? 'text-red-600' : 
                changeType === 'warning' ? 'text-amber-600' : 'text-muted-foreground'
              }`}>
                {change}
              </p>
            )}
          </div>
          <div className={`p-1.5 sm:p-2 rounded-lg ${iconBg}`}>
            <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
