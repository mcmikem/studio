'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Income, Expense } from '@/lib/types';
import { expenseItemCategories } from '@/lib/types';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { BarChart3, Download, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function ReportsPage() {
  const firestore = useFirestore();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const incomeQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc')) : null, [firestore]);
  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null, [firestore]);

  const { data: allIncome, isLoading: isLoadingIncome } = useCollection<Income>(incomeQuery);
  const { data: allExpenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

  const isLoading = isLoadingIncome || isLoadingExpenses;

  const report = useMemo(() => {
    if (!allIncome || !allExpenses) return null;

    const [year, mon] = month.split('-').map(Number);
    const monthStart = new Date(year, mon - 1, 1);
    const monthEnd = new Date(year, mon, 0);

    const monthlyIncome = allIncome.filter(i => {
      const d = new Date(i.dateReceived);
      return d >= monthStart && d <= monthEnd;
    });
    const monthlyExpenses = allExpenses.filter(e => {
      const d = new Date(e.date);
      return d >= monthStart && d <= monthEnd && (e.status === 'Disbursed' || e.status === 'Acknowledged');
    });

    const totalIncome = monthlyIncome.reduce((s, i) => s + Number(i.amount || 0), 0);
    const totalExpenses = monthlyExpenses.reduce((s, e) => s + Number(e.totalAmount || 0), 0);

    const byCategory: Record<string, number> = {};
    monthlyExpenses.forEach(e => {
      e.items?.forEach(item => {
        byCategory[item.category] = (byCategory[item.category] || 0) + Number(item.amount || 0);
      });
    });

    const byType: Record<string, number> = {};
    monthlyExpenses.forEach(e => {
      byType[e.type] = (byType[e.type] || 0) + Number(e.totalAmount || 0);
    });

    return {
      totalIncome,
      totalExpenses,
      net: totalIncome - totalExpenses,
      incomeEntries: monthlyIncome.length,
      expenseEntries: monthlyExpenses.length,
      categories: Object.entries(byCategory).sort((a, b) => b[1] - a[1]),
      byType: Object.entries(byType),
    };
  }, [allIncome, allExpenses, month]);

  const handleExport = () => {
    if (!report) return;
    const lines = [
      `Financial Report - ${month}`,
      ``,
      `Total Income: ${formatCurrency(report.totalIncome)}`,
      `Total Expenses: ${formatCurrency(report.totalExpenses)}`,
      `Net: ${formatCurrency(report.net)}`,
      ``,
      `Expenses by Category:`,
      ...report.categories.map(([cat, amt]) => `  ${cat}: ${formatCurrency(amt)}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${month}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-indigo-500" />
            Financial Reports
          </h1>
          <p className="text-muted-foreground">Monthly financial summaries and breakdowns.</p>
        </div>
        <div className="flex gap-2">
          <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-40" />
          <Button variant="outline" onClick={handleExport} disabled={!report}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  <p className="text-sm font-medium text-emerald-700">Income</p>
                </div>
                {isLoading ? <Skeleton className="h-8 w-28" /> : (
                  <p className="text-2xl font-bold text-emerald-700">{formatCurrency(report.totalIncome)}</p>
                )}
                <p className="text-xs text-emerald-600">{report.incomeEntries} entries</p>
              </CardContent>
            </Card>
            <Card className="border-rose-200 bg-rose-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownRight className="h-4 w-4 text-rose-500" />
                  <p className="text-sm font-medium text-rose-700">Expenses</p>
                </div>
                {isLoading ? <Skeleton className="h-8 w-28" /> : (
                  <p className="text-2xl font-bold text-rose-700">{formatCurrency(report.totalExpenses)}</p>
                )}
                <p className="text-xs text-rose-600">{report.expenseEntries} entries</p>
              </CardContent>
            </Card>
            <Card className={report.net >= 0 ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  {report.net >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                  <p className={`text-sm font-medium ${report.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>Net</p>
                </div>
                {isLoading ? <Skeleton className="h-8 w-28" /> : (
                  <p className={`text-2xl font-bold ${report.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(report.net)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {report.categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No expenses for this period.</p>
              ) : (
                <div className="space-y-3">
                  {report.categories.map(([cat, amt]) => (
                    <div key={cat} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                      <span className="text-sm font-medium">{cat}</span>
                      <span className="text-sm font-bold">{formatCurrency(amt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
