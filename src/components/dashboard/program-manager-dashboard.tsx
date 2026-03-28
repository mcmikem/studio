
'use client';

import type { DashboardProps } from "./dashboard-loader"
import { DashboardHeader } from "./dashboard-header"
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { 
  TrendingUp, DollarSign, Wallet, Clock, Activity, CheckCircle,
  Users, AlertTriangle, BarChart3, ClipboardCheck, Target,
  Heart, GraduationCap, Building2, Handshake
} from 'lucide-react';
import Link from 'next/link';
import { DashboardSection, CompactStatCard } from './dashboard-section';

export function ProgramManagerDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
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
    if (!expenses) return 0;
    return expenses
      .filter(e => {
        const created = e.createdAt?.toDate?.() || new Date(e.createdAt?.seconds ? e.createdAt.seconds * 1000 : Date.now());
        return created >= monthStart && e.status !== 'Rejected';
      })
      .reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);
  }, [expenses, monthStart]);

  const thisMonthIncome = useMemo(() => {
    if (!income) return 0;
    return income
      .filter(i => {
        const received = i.dateReceived?.toDate?.() || new Date(i.dateReceived?.seconds ? i.dateReceived.seconds * 1000 : Date.now());
        return received >= monthStart;
      })
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  }, [income, monthStart]);

  const pendingForPM = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => e.status === 'Pending').slice(0, 3);
  }, [expenses]);

  const readyForDisbursement = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => e.status === 'Approved').slice(0, 3);
  }, [expenses]);

  const totalSchools = schools?.length || 0;
  const activeSchools = schools?.filter(s => s.status === 'Active').length || 0;

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader profile={profile} />
      
      {/* Stats */}
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
          label="Net (MTD)" 
          value={formatCurrency(thisMonthIncome - thisMonthExpenses, true)} 
          icon={TrendingUp} 
          color="bg-blue-500"
        />
        <CompactStatCard 
          label="Pending" 
          value={pendingForPM.length} 
          icon={Clock} 
          color={pendingForPM.length > 0 ? "bg-amber-500" : "bg-green-500"}
          href="/finance/requisitions?status=Pending"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        <Button asChild size="sm" variant="outline" className="h-auto py-2 bg-omuto-navy text-white hover:bg-omuto-navy/90">
          <Link href="/forms/expense" className="flex flex-col items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-bold">Requisition</span>
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-auto py-2">
          <Link href="/school-xperience/log-visit" className="flex flex-col items-center gap-1">
            <ClipboardCheck className="h-4 w-4" />
            <span className="text-xs font-bold">Log Visit</span>
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-auto py-2">
          <Link href="/school-xperience/register-school" className="flex flex-col items-center gap-1">
            <GraduationCap className="h-4 w-4" />
            <span className="text-xs font-bold">Add School</span>
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-auto py-2">
          <Link href="/finance/reports" className="flex flex-col items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs font-bold">Reports</span>
          </Link>
        </Button>
      </div>

      {/* Program Overview - Compact */}
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
            <Target className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-xl font-black">{Math.round((activeSchools / (totalSchools || 1)) * 100)}%</p>
            <p className="text-[10px] uppercase text-muted-foreground">Coverage</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Items - Collapsible */}
      {(pendingForPM.length > 0 || readyForDisbursement.length > 0) && (
        <DashboardSection 
          title="Action Items" 
          icon={AlertTriangle}
          badge={`${pendingForPM.length + readyForDisbursement.length}`}
          badgeColor={pendingForPM.length > 0 ? 'red' : 'green'}
          defaultOpen={true}
        >
          <div className="space-y-2">
            {pendingForPM.map(expense => (
              <div key={expense.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{expense.title}</p>
                  <p className="text-xs text-muted-foreground">{expense.userName || 'Unknown'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">{formatCurrency(expense.totalAmount, true)}</p>
                  <Button asChild size="sm" variant="ghost" className="h-8 text-xs">
                    <Link href={`/finance/requisitions?id=${expense.id}`}>Review</Link>
                  </Button>
                </div>
              </div>
            ))}
            {readyForDisbursement.map(expense => (
              <div key={expense.id} className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-200">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{expense.title}</p>
                  <p className="text-xs text-muted-foreground">{expense.userName || 'Unknown'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">{formatCurrency(expense.totalAmount, true)}</p>
                  <span className="text-xs text-blue-600 font-medium">Ready</span>
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>
      )}
    </div>
  );
}
