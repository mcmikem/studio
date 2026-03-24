'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Income, Expense } from '@/lib/types';
import { expenseItemCategories } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { PiggyBank, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function BudgetingPage() {
  const firestore = useFirestore();

  const incomeQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc')) : null, [firestore]);
  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null, [firestore]);

  const { data: allIncome, isLoading: isLoadingIncome } = useCollection<Income>(incomeQuery);
  const { data: allExpenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

  const isLoading = isLoadingIncome || isLoadingExpenses;

  const budgetData = useMemo(() => {
    if (!allIncome || !allExpenses) return { totalBudget: 0, totalSpent: 0, remaining: 0, categories: [] };

    const totalBudget = allIncome.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const acknowledgedExpenses = allExpenses.filter(e => e.status === 'Disbursed' || e.status === 'Acknowledged');
    const totalSpent = acknowledgedExpenses.reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);

    const categoryTotals: Record<string, number> = {};
    acknowledgedExpenses.forEach(e => {
      e.items?.forEach(item => {
        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + Number(item.amount || 0);
      });
    });

    const categories = expenseItemCategories.map(cat => ({
      name: cat,
      spent: categoryTotals[cat] || 0,
      percent: totalSpent > 0 ? ((categoryTotals[cat] || 0) / totalSpent) * 100 : 0,
    })).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent);

    return {
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      categories,
    };
  }, [allIncome, allExpenses]);

  const utilization = budgetData.totalBudget > 0 ? (budgetData.totalSpent / budgetData.totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <PiggyBank className="h-8 w-8 text-green-500" />
          Budgeting
        </h1>
        <p className="text-muted-foreground">Track budget utilization and spending by category.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total Budget (Income)</CardDescription></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(budgetData.totalBudget)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total Spent</CardDescription></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-rose-600">{formatCurrency(budgetData.totalSpent)}</p>
            )}
          </CardContent>
        </Card>
        <Card className={budgetData.remaining >= 0 ? 'border-green-200' : 'border-red-200'}>
          <CardHeader className="pb-2"><CardDescription>Remaining</CardDescription></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className={`text-2xl font-bold ${budgetData.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(budgetData.remaining)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget Utilization</CardTitle>
          <CardDescription>{utilization.toFixed(1)}% of total budget used</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={Math.min(100, utilization)} className="h-4" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0%</span>
            <span className="font-medium">{utilization.toFixed(1)}%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : budgetData.categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No spending data yet.</p>
          ) : (
            <div className="space-y-4">
              {budgetData.categories.map(cat => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="text-sm font-bold">{formatCurrency(cat.spent)}</span>
                  </div>
                  <Progress value={cat.percent} className="h-2" />
                  <p className="text-xs text-muted-foreground">{cat.percent.toFixed(1)}% of total spending</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
