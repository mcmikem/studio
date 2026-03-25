
'use client';

import { DashboardHeader } from "./dashboard-header"
import { RoleMissionCard } from "./role-mission-card"
import type { DashboardProps } from "./dashboard-loader"
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { 
  TrendingUp, DollarSign, Wallet, Clock, Activity, CheckCircle,
  ArrowUpRight, ArrowDownRight, Users, AlertTriangle, Sparkles,
  Target, BarChart3, Sparkle
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export function ExecutiveDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();
  
  const expensesQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc'), limit(20)) : null
  , [firestore]);
  const { data: expenses, isLoading: expensesLoading } = useCollection(expensesQuery);

  const incomeQuery = useMemo(() => 
    firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc'), limit(20)) : null
  , [firestore]);
  const { data: income, isLoading: incomeLoading } = useCollection(incomeQuery);

  const pendingApprovals = expenses?.filter(e => e.status === 'Pending') || [];
  const totalIncome = income?.reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.totalAmount || 0), 0) || 0;
  const balance = totalIncome - totalExpenses;

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <QuickStatCard title="Total Income" value={formatCurrency(totalIncome)} icon={DollarSign} iconBg="bg-green-100" iconColor="text-green-600" href="/finance/income" />
        <QuickStatCard title="Total Expenses" value={formatCurrency(totalExpenses)} icon={Wallet} iconBg="bg-red-100" iconColor="text-red-600" href="/finance/requisitions" />
        <QuickStatCard title="Net Balance" value={formatCurrency(balance)} change={balance >= 0 ? 'Healthy' : 'Over budget'} changeType={balance >= 0 ? 'positive' : 'negative'} icon={TrendingUp} iconBg={balance >= 0 ? 'bg-green-100' : 'bg-red-100'} iconColor={balance >= 0 ? 'text-green-600' : 'text-red-600'} />
        <QuickStatCard title="Pending" value={pendingApprovals.length.toString()} change={`${pendingApprovals.length} needs review`} changeType={pendingApprovals.length > 0 ? 'neutral' : 'positive'} icon={Clock} iconBg="bg-amber-100" iconColor="text-amber-600" href="/finance/requisitions" />
      </div>

      {/* Approvals */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-amber-500" />
            Pending Approvals
          </h3>
          <div className="space-y-2">
            {expensesLoading ? <Skeleton className="h-20 w-full" /> : 
             pendingApprovals.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">
                 <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                 <p className="text-sm font-medium">All caught up!</p>
               </div>
             ) : pendingApprovals.slice(0, 5).map(expense => {
               const createdAt = expense.createdAt?.toDate?.() || new Date();
               const days = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
               return (
                 <div key={expense.id} className={`flex items-center justify-between p-3 rounded-xl border-l-4 ${days >= 3 ? 'border-l-red-500 bg-red-50' : 'border-l-amber-500 bg-amber-50'}`}>
                   <div className="min-w-0">
                     <p className="text-sm font-bold text-omuto-navy truncate">{expense.title}</p>
                     <p className="text-xs text-muted-foreground">{expense.userName || 'Unknown'} · {days}d ago</p>
                   </div>
                   <div className="text-right flex-shrink-0">
                     <p className="text-sm font-black text-omuto-navy">{formatCurrency(expense.totalAmount)}</p>
                     <Button size="sm" variant="ghost" className="h-6 text-[10px] font-bold text-primary">Review</Button>
                   </div>
                 </div>
               );
             })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-blue-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild className="w-full justify-start h-auto py-3 px-4 bg-omuto-navy">
              <Link href="/forms/expense" className="flex items-center gap-3">
                <DollarSign className="h-4 w-4" />
                <div className="text-left"><p className="font-bold text-xs">New Requisition</p><p className="text-[10px] opacity-70">Request funds</p></div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-auto py-3 px-4">
              <Link href="/finance/income" className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4" />
                <div className="text-left"><p className="font-bold text-xs">Log Income</p><p className="text-[10px] text-muted-foreground">Record funding</p></div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-auto py-3 px-4">
              <Link href="/finance/accountabilities" className="flex items-center gap-3">
                <Users className="h-4 w-4" />
                <div className="text-left"><p className="font-bold text-xs">Staff Accountabilities</p><p className="text-[10px] text-muted-foreground">Track funds</p></div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-auto py-3 px-4">
              <Link href="/finance/reports" className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4" />
                <div className="text-left"><p className="font-bold text-xs">Reports</p><p className="text-[10px] text-muted-foreground">View analytics</p></div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <RoleMissionCard profile={profile} />
    </div>
  );
}

function QuickStatCard({ title, value, change, changeType, icon: Icon, iconBg, iconColor, href }: {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  href?: string;
}) {
  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-xl sm:text-2xl font-black text-omuto-navy">{value}</p>
            {change && (
              <p className={`text-[10px] sm:text-xs font-semibold flex items-center gap-1 ${
                changeType === 'positive' ? 'text-green-600' : 
                changeType === 'negative' ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {changeType === 'positive' ? <ArrowUpRight className="h-3 w-3" /> : 
                 changeType === 'negative' ? <ArrowDownRight className="h-3 w-3" /> : null}
                {change}
              </p>
            )}
          </div>
          <div className={`p-2 sm:p-3 rounded-xl ${iconBg}`}>
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
