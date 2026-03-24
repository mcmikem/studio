'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Income, Expense } from '@/lib/types';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle, CheckCircle2,
  Clock, Banknote, FileText, ShieldCheck, ReceiptText, TrendingUp, TrendingDown
} from 'lucide-react';

export default function FinanceDashboardPage() {
  const firestore = useFirestore();

  const incomeQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc')) : null, [firestore]);
  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null, [firestore]);

  const { data: allIncome, isLoading: isLoadingIncome } = useCollection<Income>(incomeQuery);
  const { data: allExpenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

  const isLoading = isLoadingIncome || isLoadingExpenses;

  const stats = useMemo(() => {
    if (!allIncome || !allExpenses) return null;

    const totalIncome = allIncome.reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const acknowledgedExpenses = allExpenses.filter(e => e.status === 'Disbursed' || e.status === 'Acknowledged');
    const totalSpent = acknowledgedExpenses.reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);

    const pendingExpenses = allExpenses.filter(e => e.status === 'Pending');
    const approvedExpenses = allExpenses.filter(e => e.status === 'Approved');
    const rejectedExpenses = allExpenses.filter(e => e.status === 'Rejected');

    const requisitions = allExpenses.filter(e => e.type === 'Requisition');
    const reimbursements = allExpenses.filter(e => e.type === 'Reimbursement');

    // Funds held by staff (disbursed requisitions not yet acknowledged)
    const fundsHeldByStaff = requisitions
      .filter(e => e.status === 'Disbursed')
      .reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);

    // Pending accountabilities (staff who received funds)
    const staffWithFunds = new Map<string, { name: string; amount: number }>();
    requisitions.filter(e => e.status === 'Disbursed').forEach(e => {
      const existing = staffWithFunds.get(e.userId);
      if (existing) {
        existing.amount += Number(e.totalAmount || 0);
      } else {
        staffWithFunds.set(e.userId, { name: e.userName, amount: Number(e.totalAmount || 0) });
      }
    });

    return {
      totalIncome,
      totalSpent,
      balance: totalIncome - totalSpent,
      pendingCount: pendingExpenses.length,
      approvedCount: approvedExpenses.length,
      rejectedCount: rejectedExpenses.length,
      requisitionCount: requisitions.length,
      reimbursementCount: reimbursements.length,
      fundsHeldByStaff,
      staffWithFunds: Array.from(staffWithFunds.values()),
      recentTransactions: [
        ...allIncome.slice(0, 5).map(i => ({
          id: i.id,
          type: 'income' as const,
          description: i.source,
          amount: Number(i.amount || 0),
          date: i.dateReceived,
        })),
        ...allExpenses.filter(e => e.status !== 'Pending').slice(0, 5).map(e => ({
          id: e.id,
          type: 'expense' as const,
          description: e.title,
          amount: Number(e.totalAmount || 0),
          date: e.date,
          status: e.status,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8),
    };
  }, [allIncome, allExpenses]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Finance Dashboard</h1>
        <p className="text-muted-foreground">Overview of organizational finances, funds held by staff, and pending actions.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> Total Income
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats?.totalIncome || 0)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" /> Total Spent
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-rose-600">{formatCurrency(stats?.totalSpent || 0)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              <Wallet className="h-3.5 w-3.5 text-primary" /> Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className={`text-2xl font-bold ${(stats?.balance || 0) >= 0 ? 'text-primary' : 'text-rose-600'}`}>
                {formatCurrency(stats?.balance || 0)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              <Banknote className="h-3.5 w-3.5 text-amber-500" /> Held by Staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(stats?.fundsHeldByStaff || 0)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Pending Actions
            </CardTitle>
            <CardDescription>Expenses awaiting review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/finance/requisitions" className="flex items-center justify-between p-3 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Pending Approval</span>
              </div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">{stats?.pendingCount || 0}</Badge>
            </Link>
            <Link href="/finance/requisitions" className="flex items-center justify-between p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Awaiting Disbursement</span>
              </div>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">{stats?.approvedCount || 0}</Badge>
            </Link>
          </CardContent>
        </Card>

        {/* Staff Holding Funds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-amber-500" /> Funds Held by Staff
            </CardTitle>
            <CardDescription>Staff with unaccounted funds</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : stats?.staffWithFunds && stats.staffWithFunds.length > 0 ? (
              <div className="space-y-2">
                {stats.staffWithFunds.slice(0, 5).map((staff, i) => (
                  <Link key={i} href="/finance/accountabilities" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium truncate">{staff.name}</span>
                    <span className="text-sm font-bold text-amber-600">{formatCurrency(staff.amount)}</span>
                  </Link>
                ))}
                {stats.staffWithFunds.length > 5 && (
                  <Link href="/finance/accountabilities" className="text-xs text-primary font-medium block text-center pt-2">
                    View all ({stats.staffWithFunds.length}) →
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No staff holding funds</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common finance tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start h-11">
              <Link href="/finance/income"><ArrowUpRight className="mr-2 h-4 w-4 text-emerald-500" /> Log Income</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-11">
              <Link href="/finance/requisitions"><FileText className="mr-2 h-4 w-4 text-blue-500" /> New Requisition</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-11">
              <Link href="/finance/claims"><ReceiptText className="mr-2 h-4 w-4 text-purple-500" /> Submit Claim</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-11">
              <Link href="/finance/petty-cash"><Banknote className="mr-2 h-4 w-4 text-amber-500" /> Petty Cash</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-11">
              <Link href="/finance/accountabilities"><ShieldCheck className="mr-2 h-4 w-4 text-rose-500" /> View Accountabilities</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
          <CardDescription>Latest financial activity</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
            <div className="space-y-1">
              {stats.recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {t.type === 'income' ? (
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                        <ArrowDownRight className="h-4 w-4 text-rose-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDateSafe(t.date, 'dateOnly')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
