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
import { PageHeader } from '@/components/page-header';
import {
  ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle, CheckCircle2,
  Clock, Banknote, FileText, ShieldCheck, ReceiptText, TrendingUp, TrendingDown,
  PlusCircle, ArrowRight, Layers, Landmark
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Finance Hub"
        description="Consolidated overview of Omuto's liquidity, staff balances, and pending approvals."
        icon={Wallet}
      >
        <Button asChild className="btn-omuto border shadow-comic-sm">
            <Link href="/forms/expense"><PlusCircle className="mr-2 h-4 w-4" /> New Request</Link>
        </Button>
      </PageHeader>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 border-emerald-500/20 bg-emerald-500/5 rounded-[2.5rem] shadow-xl overflow-hidden">
          <CardContent className="p-8 pb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-600"><ArrowUpRight className="h-5 w-5" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50">Total Income</p>
            </div>
            {isLoading ? <Skeleton className="h-10 w-32" /> : (
              <p className="text-3xl font-black text-emerald-600 tracking-tight leading-none">{formatCurrency(stats?.totalIncome || 0)}</p>
            )}
            <p className="text-[10px] font-bold text-emerald-600/30 uppercase mt-4 tracking-widest">Lifetime Revenue</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-rose-500/20 bg-rose-500/5 rounded-[2.5rem] shadow-xl overflow-hidden">
          <CardContent className="p-8 pb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-rose-500/20 rounded-xl text-rose-600"><ArrowDownRight className="h-5 w-5" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/50">Total Spent</p>
            </div>
            {isLoading ? <Skeleton className="h-10 w-32" /> : (
              <p className="text-3xl font-black text-rose-600 tracking-tight leading-none">{formatCurrency(stats?.totalSpent || 0)}</p>
            )}
             <p className="text-[10px] font-bold text-rose-600/30 uppercase mt-4 tracking-widest">Verified Expenses</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 bg-primary/5 rounded-[2.5rem] shadow-xl overflow-hidden">
          <CardContent className="p-8 pb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-primary/20 rounded-xl text-primary"><Wallet className="h-5 w-5" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Net Balance</p>
            </div>
            {isLoading ? <Skeleton className="h-10 w-32" /> : (
              <p className={cn("text-3xl font-black tracking-tight leading-none", (stats?.balance || 0) >= 0 ? "text-primary" : "text-rose-600")}>
                {formatCurrency(stats?.balance || 0)}
              </p>
            )}
            <p className="text-[10px] font-bold text-primary/30 uppercase mt-4 tracking-widest">Available Liquidity</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-500/20 bg-amber-500/5 rounded-[2.5rem] shadow-xl overflow-hidden">
          <CardContent className="p-8 pb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-600"><Banknote className="h-5 w-5" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/50">Staff Debts</p>
            </div>
            {isLoading ? <Skeleton className="h-10 w-32" /> : (
              <p className="text-3xl font-black text-amber-600 tracking-tight leading-none">{formatCurrency(stats?.fundsHeldByStaff || 0)}</p>
            )}
             <p className="text-[10px] font-bold text-amber-600/30 uppercase mt-4 tracking-widest">Unaccounted Funds</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Pending Actions & Staff Holding Funds */}
        <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                 {/* Pending Actions */}
                <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight text-omuto-navy">
                    <AlertTriangle className="h-6 w-6 text-amber-500" /> Pending Approval
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Budget requests awaiting review</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-3">
                    <Link href="/finance/requisitions" className="flex items-center justify-between p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl hover:bg-amber-500/10 transition-colors group">
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-amber-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-amber-600">Awaiting ED Review</span>
                    </div>
                    <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center p-0 border-2 border-amber-500 text-amber-600 font-black">{stats?.pendingCount || 0}</Badge>
                    </Link>
                    <Link href="/finance/requisitions" className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl hover:bg-blue-500/10 transition-colors group">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-blue-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-blue-600">Ready for Pay-out</span>
                    </div>
                    <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center p-0 border-2 border-blue-500 text-blue-600 font-black">{stats?.approvedCount || 0}</Badge>
                    </Link>
                </CardContent>
                </Card>

                {/* Staff Holding Funds */}
                <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight text-omuto-navy">
                    <ShieldCheck className="h-6 w-6 text-amber-600" /> Fund Retirement
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Team members with unaccounted balances</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    {isLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                    </div>
                    ) : stats?.staffWithFunds && stats.staffWithFunds.length > 0 ? (
                    <div className="space-y-2">
                        {stats.staffWithFunds.slice(0, 3).map((staff, i) => (
                        <Link key={i} href="/finance/accountabilities" className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-colors border border-transparent hover:border-omuto-navy/5">
                            <span className="text-xs font-bold text-omuto-navy truncate">{staff.name}</span>
                            <span className="text-sm font-black text-amber-600 tracking-tight">{formatCurrency(staff.amount)}</span>
                        </Link>
                        ))}
                        {stats.staffWithFunds.length > 3 && (
                        <Link href="/finance/accountabilities" className="text-[10px] font-black uppercase tracking-widest text-primary text-center block pt-4 hover:underline">
                            View all balances ({stats.staffWithFunds.length}) →
                        </Link>
                        )}
                    </div>
                    ) : (
                    <div className="py-10 text-center">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500/20 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">System Balance Verified</p>
                    </div>
                    )}
                </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 pb-4 border-b bg-muted/30">
                <CardTitle className="text-xl font-black uppercase tracking-tight text-omuto-navy">Ledger Stream</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Latest financial movements within the terminal</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-8 space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
                ) : stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                    <div className="divide-y divide-omuto-navy/5">
                    {stats.recentTransactions.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-6 hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                            {t.type === 'income' ? (
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                            </div>
                            ) : (
                            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border-2 border-rose-500/20 flex items-center justify-center flex-shrink-0">
                                <ArrowDownRight className="h-5 w-5 text-rose-600" />
                            </div>
                            )}
                            <div className="min-w-0">
                            <p className="text-sm font-black text-omuto-navy truncate uppercase tracking-tight">{t.description}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{formatDateSafe(t.date, 'dateOnly')}</p>
                            </div>
                        </div>
                        <span className={cn("text-base font-black tracking-tight flex-shrink-0", t.type === 'income' ? 'text-emerald-600' : 'text-rose-600')}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                         <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                             <Layers className="h-8 w-8 text-muted-foreground/30" />
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">No transactions log recorded</p>
                    </div>
                )}
                </CardContent>
            </Card>
        </div>

        {/* Quick Links Column */}
        <div className="lg:col-span-4 space-y-6 lg:space-y-8">
            <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden sticky top-8">
            <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black uppercase tracking-tight text-omuto-navy">Shortcuts</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rapid terminal access</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
                <Button asChild variant="outline" className="w-full justify-between h-16 rounded-2xl border-2 border-omuto-navy/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group">
                    <Link href="/finance/income" className="flex items-center">
                        <ArrowUpRight className="mr-3 h-5 w-5 text-emerald-500" /> 
                        <span className="font-black uppercase tracking-widest text-xs">Log Income</span>
                        <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between h-16 rounded-2xl border-2 border-omuto-navy/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                    <Link href="/forms/expense" className="flex items-center">
                        <FileText className="mr-3 h-5 w-5 text-blue-500" /> 
                        <span className="font-black uppercase tracking-widest text-xs">New Request</span>
                        <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between h-16 rounded-2xl border-2 border-omuto-navy/5 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group">
                    <Link href="/finance/petty-cash" className="flex items-center">
                        <Landmark className="mr-3 h-5 w-5 text-amber-500" /> 
                        <span className="font-black uppercase tracking-widest text-xs">Petty Cash</span>
                        <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between h-16 rounded-2xl border-2 border-omuto-navy/5 hover:border-rose-500/50 hover:bg-rose-500/5 transition-all group">
                    <Link href="/finance/accountabilities" className="flex items-center">
                        <ShieldCheck className="mr-3 h-5 w-5 text-rose-500" /> 
                        <span className="font-black uppercase tracking-widest text-xs">Balances</span>
                        <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </Link>
                </Button>
                
                <div className="pt-8 text-center px-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-omuto-navy/20 leading-relaxed">Omuto Central Finance Terminal © 2025</p>
                </div>
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
