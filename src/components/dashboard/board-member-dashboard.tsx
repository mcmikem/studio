'use client';

import { DashboardHeader } from "./dashboard-header"
import type { DashboardProps } from "./dashboard-loader"
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Income, Expense } from '@/lib/types';
import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { DashboardSection, CompactStatCard } from './dashboard-section';
import { NotificationsWidget } from './notifications-widget';
import { EcosystemPulse } from './ecosystem-pulse';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  TrendingUp, DollarSign, Wallet, 
  FileText, Users, BarChart3, Heart,
  Briefcase, Lightbulb, Clock
} from 'lucide-react';
import { calculateFinancialSnapshot, getPendingExpenses } from '@/lib/finance-utils';

const KeyResultsTracker = dynamic(() => import('@/components/plan/key-results-tracker').then(mod => mod.KeyResultsTracker), {
  loading: () => <Card className="h-64"><CardContent className="p-4 flex items-center justify-center">Loading strategy...</CardContent></Card>,
  ssr: false,
});

const DashboardCalendar = dynamic(() => import('@/components/dashboard/dashboard-calendar').then(mod => mod.DashboardCalendar), {
  loading: () => <Card className="h-64"><CardContent className="p-4 flex items-center justify-center">Loading calendar...</CardContent></Card>,
  ssr: false,
});

export function BoardMemberDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const expensesQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null
  , [firestore]);
  const { data: expenses } = useCollection<Expense>(expensesQuery);

  const incomeQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc')) : null
  , [firestore]);
  const { data: income } = useCollection<Income>(incomeQuery);

  const financialSnapshot = useMemo(() => {
    if (!income || !expenses || !mounted) return null;
    return calculateFinancialSnapshot(income, expenses);
  }, [income, expenses, mounted]);

  const pendingApprovals = useMemo(() => {
    if (!expenses) return 0;
    return getPendingExpenses(expenses).length;
  }, [expenses]);

  const balance = financialSnapshot?.availableBalance ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader profile={profile} />
      
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-omuto-navy to-blue-900 text-white border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Welcome, {profile.name?.split(' ')[0]}
              </h1>
              <p className="text-blue-100 mt-1 max-w-xl">
                Board Portal for strategic oversight. Monitor organizational performance, review key results, and access governance materials.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="secondary" size="sm" className="font-bold">
                <Link href="/management/operational-plan">
                  <FileText className="h-4 w-4 mr-2" />
                  Strategy
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="font-bold">
                <Link href="/reports">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Reports
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <CompactStatCard 
          label="Confirmed Income" 
          value={formatCurrency(financialSnapshot?.confirmedIncome ?? 0, true)} 
          icon={DollarSign} 
          color="bg-green-500"
          href="/finance/income"
        />
        <CompactStatCard 
          label="Total Spent" 
          value={formatCurrency(financialSnapshot?.totalSpent ?? 0, true)} 
          icon={Wallet} 
          color="bg-red-500"
          href="/finance/requisitions"
        />
        <CompactStatCard 
          label="Available Balance" 
          value={formatCurrency(balance, true)} 
          icon={TrendingUp} 
          color={balance >= 0 ? "bg-green-500" : "bg-red-500"}
        />
        <CompactStatCard 
          label="Pending Approvals" 
          value={pendingApprovals} 
          icon={Clock} 
          color={pendingApprovals > 0 ? "bg-amber-500" : "bg-green-500"}
          href="/finance/requisitions?status=Pending"
        />
      </div>

      {/* Additional Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <CompactStatCard 
          label="Pending Income" 
          value={formatCurrency(financialSnapshot?.pendingIncome ?? 0, true)} 
          icon={DollarSign} 
          color="bg-amber-500"
        />
        <CompactStatCard 
          label="Funds Held by Staff" 
          value={formatCurrency(financialSnapshot?.fundsHeldByStaff ?? 0, true)} 
          icon={Wallet} 
          color="bg-orange-500"
          href="/finance/accountabilities"
        />
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Primary Content */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Key Results Tracker */}
          <KeyResultsTracker />

          {/* Strategic Quick Links */}
          <DashboardSection title="Strategic Resources" icon={Lightbulb} defaultOpen={true}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2">
                <Link href="/management/operational-plan">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-bold">Operational Plan</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2">
                <Link href="/finance/reports">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span className="text-xs font-bold">Financial Reports</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2">
                <Link href="/reports/deep-dive">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="text-xs font-bold">Impact Analysis</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2">
                <Link href="/management/programs">
                  <Heart className="h-5 w-5 text-pink-600" />
                  <span className="text-xs font-bold">Programs</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2">
                <Link href="/management/partnerships">
                  <Users className="h-5 w-5 text-amber-600" />
                  <span className="text-xs font-bold">Partnerships</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-3 flex flex-col items-center gap-2">
                <Link href="/team-performance">
                  <Briefcase className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs font-bold">Team Performance</span>
                </Link>
              </Button>
            </div>
          </DashboardSection>

          {/* Ecosystem Pulse */}
          <EcosystemPulse />

        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4">
          {/* Role Mission */}
          <Card className="bg-omuto-navy text-white">
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase opacity-60 mb-1">Your Role</p>
              <p className="text-sm font-semibold">
                Board oversight, strategic guidance, and governance
              </p>
            </CardContent>
          </Card>

          {/* Board Chair Contact */}
          <Card className="border-2 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Board Chair</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">Gerald</p>
                  <p className="text-xs text-muted-foreground">gerald@omuto.org</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <NotificationsWidget />

          {/* Calendar Preview */}
          <DashboardCalendar />
        </div>
      </div>
    </div>
  );
}
