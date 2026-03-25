'use client';

import React from 'react';
import type { User as UserProfileType } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { DefaultDashboard } from './default-dashboard';
import { DashboardSkeleton } from './dashboard-skeleton';
import { NotificationPrompt } from '@/components/notifications/notification-prompt';
import { DashboardHeader } from './dashboard-header';
import { RoleMissionCard } from './role-mission-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Activity, 
  Calendar, ArrowUpRight, ArrowDownRight, Clock, CheckCircle,
  AlertCircle, Wallet, PieChart, BarChart3
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface DashboardProps {
  profile: UserProfileType;
}

// ============= QUICK STATS CARD =============
function StatCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  iconBg, 
  iconColor,
  href 
}: {
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
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
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

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// ============= ACTIVITY ITEM =============
function ActivityItem({ 
  icon: Icon, 
  iconBg, 
  iconColor, 
  title, 
  description, 
  time,
  urgent 
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  time?: string;
  urgent?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
      <div className={`p-2 rounded-lg ${iconBg}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${urgent ? 'text-red-600' : 'text-omuto-navy'}`}>{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
        {time && <p className="text-[10px] text-muted-foreground mt-1">{time}</p>}
      </div>
      {urgent && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
    </div>
  );
}

// ============= PENDING APPROVAL ITEM =============
function PendingApproval({ title, amount, requester, days }: { title: string; amount: number; requester: string; days: number }) {
  const isUrgent = days >= 3;
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border-l-4 ${isUrgent ? 'border-l-red-500 bg-red-50' : 'border-l-amber-500 bg-amber-50'}`}>
      <div className="min-w-0">
        <p className="text-sm font-bold text-omuto-navy truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{requester} · {days}d ago</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black text-omuto-navy">{formatCurrency(amount)}</p>
        <Button size="sm" variant="ghost" className="h-6 text-[10px] font-bold text-primary">Review</Button>
      </div>
    </div>
  );
}

// ============= EXECUTIVE DASHBOARD =============
function ExecutiveDashboard({ profile }: DashboardProps) {
  const firestore = useFirestore();

  const expensesQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null
  , [firestore]);
  const { data: expenses, isLoading: expensesLoading } = useCollection(expensesQuery);

  const incomeQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc')) : null
  , [firestore]);
  const { data: income, isLoading: incomeLoading } = useCollection(incomeQuery);

  // Calculate stats
  const pendingApprovals = expenses?.filter(e => e.status === 'Pending') || [];
  const totalIncome = income?.reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.totalAmount || 0), 0) || 0;
  const balance = totalIncome - totalExpenses;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <DashboardHeader profile={profile} />

      {/* Quick Stats - Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          title="Total Income" 
          value={formatCurrency(totalIncome)} 
          icon={DollarSign}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          href="/finance/income"
        />
        <StatCard 
          title="Total Expenses" 
          value={formatCurrency(totalExpenses)} 
          icon={Wallet}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          href="/finance/requisitions"
        />
        <StatCard 
          title="Net Balance" 
          value={formatCurrency(balance)} 
          change={balance >= 0 ? 'Healthy' : 'Over budget'}
          changeType={balance >= 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
          iconBg={balance >= 0 ? 'bg-green-100' : 'bg-red-100'}
          iconColor={balance >= 0 ? 'text-green-600' : 'text-red-600'}
        />
        <StatCard 
          title="Pending" 
          value={pendingApprovals.length.toString()} 
          change={`${pendingApprovals.length} needs review`}
          changeType={pendingApprovals.length > 0 ? 'neutral' : 'positive'}
          icon={Clock}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          href="/finance/requisitions"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Pending Approvals */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Pending Approvals
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/finance/requisitions" className="text-[10px] sm:text-xs font-bold">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {expensesLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs">No pending approvals</p>
              </div>
            ) : (
              pendingApprovals.slice(0, 5).map(expense => {
                const createdAt = expense.createdAt?.toDate?.() || new Date();
                const days = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <PendingApproval 
                    key={expense.id}
                    title={expense.title}
                    amount={expense.totalAmount}
                    requester={expense.userName || 'Unknown'}
                    days={days}
                  />
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start h-auto py-3 px-4 bg-omuto-navy">
              <Link href="/forms/expense" className="flex items-center gap-3">
                <DollarSign className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-bold text-xs">New Requisition</p>
                  <p className="text-[10px] opacity-70">Request funds</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-auto py-3 px-4">
              <Link href="/finance/income" className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-bold text-xs">Log Income</p>
                  <p className="text-[10px] text-muted-foreground">Record funding</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-auto py-3 px-4">
              <Link href="/finance/accountabilities" className="flex items-center gap-3">
                <Users className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-bold text-xs">Staff Accountabilities</p>
                  <p className="text-[10px] text-muted-foreground">Track funds</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-auto py-3 px-4">
              <Link href="/finance/reports" className="flex items-center gap-3">
                <PieChart className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-bold text-xs">Reports</p>
                  <p className="text-[10px] text-muted-foreground">View analytics</p>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {expensesLoading || incomeLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <>
              {expenses?.slice(0, 3).map(expense => (
                <ActivityItem 
                  key={expense.id}
                  icon={Wallet}
                  iconBg="bg-red-50"
                  iconColor="text-red-500"
                  title={`Expense: ${expense.title}`}
                  description={`${expense.userName || 'Unknown'} · ${formatCurrency(expense.totalAmount)}`}
                  time={expense.createdAt ? formatDistanceToNow(expense.createdAt.toDate(), { addSuffix: true }) : undefined}
                />
              ))}
              {income?.slice(0, 2).map(inc => (
                <ActivityItem 
                  key={inc.id}
                  icon={DollarSign}
                  iconBg="bg-green-50"
                  iconColor="text-green-600"
                  title={`Income: ${inc.source}`}
                  description={formatCurrency(inc.amount)}
                  time={inc.dateReceived ? formatDistanceToNow(new Date(inc.dateReceived), { addSuffix: true }) : undefined}
                />
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <RoleMissionCard profile={profile} />
    </div>
  );
}

// ============= ADMIN DASHBOARD =============
function AdminDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      <ExecutiveDashboard profile={profile} />
    </div>
  );
}

// ============= FIELD STAFF DASHBOARD =============
function FieldStaffDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      <ExecutiveDashboard profile={profile} />
    </div>
  );
}

// ============= PROGRAM MANAGER DASHBOARD =============
function ProgramManagerDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      <ExecutiveDashboard profile={profile} />
    </div>
  );
}

// ============= MEDIA & FINANCE DASHBOARD =============
function MediaFinanceDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      <ExecutiveDashboard profile={profile} />
    </div>
  );
}

// ============= INTERN DASHBOARD =============
function InternDashboard({ profile }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader profile={profile} />
      <ExecutiveDashboard profile={profile} />
    </div>
  );
}

// ============= MAIN LOADER =============
export function DashboardLoader() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user);

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user || !profile) {
    return <DefaultDashboard />;
  }

  const role = profile.role;

  let DashboardComponent: React.ComponentType<{ profile: UserProfileType }> | null = null;

  if (role === 'Administrator') {
    DashboardComponent = AdminDashboard;
  } else if (role === 'Executive Director') {
    DashboardComponent = ExecutiveDashboard;
  } else if (role === 'Programs & Partnerships Manager') {
    DashboardComponent = ProgramManagerDashboard;
  } else if (role === 'Operations & Field Manager' || role === 'Field Coordinator') {
    DashboardComponent = FieldStaffDashboard;
  } else if (role === 'Media & Finance Lead' || role === 'Media & Communications Lead') {
    DashboardComponent = MediaFinanceDashboard;
  } else if (role === 'Intern') {
    DashboardComponent = InternDashboard;
  }

  if (!DashboardComponent) {
    return <DefaultDashboard />;
  }

  return (
    <div className="w-full space-y-4">
      <NotificationPrompt />
      <DashboardComponent profile={profile} />
    </div>
  );
}