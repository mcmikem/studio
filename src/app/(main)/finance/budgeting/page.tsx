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
import { 
  calculateTotalSpent, 
  calculateTotalIncome, 
  getConfirmedIncome,
  getActualExpenses,
  calculateSpendingByCategory,
  getPendingIncome
} from '@/lib/finance-utils';
import { PiggyBank, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function BudgetingPage() {
  const firestore = useFirestore();

  const incomeQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc')) : null, [firestore]);
  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null, [firestore]);

  const { data: allIncome, isLoading: isLoadingIncome } = useCollection<Income>(incomeQuery);
  const { data: allExpenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

  const isLoading = isLoadingIncome || isLoadingExpenses;

  const budgetData = useMemo(() => {
    if (!allIncome || !allExpenses) return { 
      confirmedBudget: 0, 
      pendingBudget: 0,
      totalBudget: 0, 
      totalSpent: 0, 
      remaining: 0, 
      available: 0,
      categories: [] 
    };

    const confirmedIncome = calculateTotalIncome(allIncome, true);
    const pendingIncome = calculateTotalIncome(getPendingIncome(allIncome));
    const totalIncome = confirmedIncome + pendingIncome;
    
    const totalSpent = calculateTotalSpent(allExpenses);
    const categories = calculateSpendingByCategory(allExpenses);

    return {
      confirmedBudget: confirmedIncome,
      pendingBudget: pendingIncome,
      totalBudget: totalIncome,
      totalSpent,
      remaining: confirmedIncome - totalSpent,
      available: confirmedIncome - totalSpent,
      categories,
    };
  }, [allIncome, allExpenses]);

  const utilization = budgetData.confirmedBudget > 0 ? (budgetData.totalSpent / budgetData.confirmedBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
          <PiggyBank className="h-8 w-8 text-green-500" />
          Budgeting
        </h1>
        <p className="text-muted-foreground">Track budget utilization and spending by category.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200">
          <CardHeader className="pb-2"><CardDescription className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Confirmed Budget</CardDescription></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(budgetData.confirmedBudget)}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardHeader className="pb-2"><CardDescription className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending Income</CardDescription></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(budgetData.pendingBudget)}</p>
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
          <CardHeader className="pb-2"><CardDescription>Available Balance</CardDescription></CardHeader>
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
          <CardDescription>{utilization.toFixed(1)}% of confirmed budget used</CardDescription>
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
