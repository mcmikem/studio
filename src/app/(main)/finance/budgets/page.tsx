'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import type { BudgetPeriod, Expense } from '@/lib/types';
import { expenseItemCategories } from '@/lib/types';
import { formatCurrency, formatDateSafe, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { PageHeader } from '@/components/page-header';
import { PiggyBank, PlusCircle, Edit, Trash2, Target, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { calculateBudgetUtilization, filterByBudgetPeriod } from '@/lib/finance-utils';

export default function BudgetsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetPeriod | null>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const financeRoles = ['Executive Director', 'Media & Finance Lead', 'Administrator', 'Media & Communications Lead'];
  const canManage = profile && financeRoles.includes(profile.role);

  const budgetsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'budgets'), orderBy('startDate', 'desc')) : null, 
  [firestore]);
  const { data: budgets, isLoading: isLoadingBudgets } = useCollection<BudgetPeriod>(budgetsQuery);

  const expensesQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null, 
  [firestore]);
  const { data: allExpenses } = useCollection<Expense>(expensesQuery);

  const activeBudget = budgets?.find(b => b.isActive);
  const budgetUtilization = useMemo(() => {
    if (!activeBudget || !allExpenses) return [];
    return calculateBudgetUtilization(activeBudget, allExpenses);
  }, [activeBudget, allExpenses]);

  const totalSpent = budgetUtilization.reduce((sum, c) => sum + c.spent, 0);
  const totalBudget = budgetUtilization.reduce((sum, c) => sum + c.budgeted, 0);
  const overallPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const [form, setForm] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 3, 0).toISOString().split('T')[0],
    totalBudget: '',
    categoryLimits: {} as Record<string, string>,
  });

  const resetForm = () => {
    setForm({
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 3, 0).toISOString().split('T')[0],
      totalBudget: '',
      categoryLimits: {},
    });
    setEditingBudget(null);
  };

  const handleSubmit = async () => {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      const data = {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        totalBudget: Number(form.totalBudget),
        categoryLimits: Object.fromEntries(
          Object.entries(form.categoryLimits).filter(([, v]) => v)
        ),
        isActive: true,
        createdAt: serverTimestamp(),
      };

      if (editingBudget) {
        await updateDocumentNonBlocking(doc(firestore, 'budgets', editingBudget.id), data);
        toast({ title: 'Budget Updated' });
      } else {
        await addDocumentNonBlocking(collection(firestore, 'budgets'), data);
        toast({ title: 'Budget Created' });
      }
      setShowForm(false);
      resetForm();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save budget.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setActiveBudget = async (budgetId: string) => {
    if (!firestore) return;
    try {
      const allBudgets = budgets || [];
      for (const b of allBudgets) {
        await updateDocumentNonBlocking(doc(firestore, 'budgets', b.id), { isActive: b.id === budgetId });
      }
      toast({ title: 'Active Budget Set' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to set active budget.' });
    }
  };

  return (
    <div className="space-y-6 pb-20 px-4 sm:px-0">
      <PageHeader
        icon={PiggyBank}
        title="Budget Management"
        description="Set budget limits by period and track utilization by category."
      >
        {canManage && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="btn-omuto">
            <PlusCircle className="mr-2 h-4 w-4" /> New Budget
          </Button>
        )}
      </PageHeader>

      {activeBudget && (
        <>
          {/* Active Budget Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Target className="h-4 w-4" /> Total Budget
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{formatCurrency(activeBudget.totalBudget)}</p>
                <p className="text-xs text-muted-foreground">{activeBudget.name}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-rose-500" /> Total Spent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-rose-600">{formatCurrency(totalSpent)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Remaining</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={cn("text-2xl font-bold", totalBudget - totalSpent >= 0 ? "text-green-600" : "text-red-600")}>
                  {formatCurrency(totalBudget - totalSpent)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={cn("text-2xl font-bold", overallPercent > 100 ? "text-red-600" : overallPercent > 80 ? "text-amber-600" : "text-green-600")}>
                  {overallPercent.toFixed(1)}%
                </p>
                <Progress value={Math.min(100, overallPercent)} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Budget vs Actual by Category</CardTitle>
              <CardDescription>Track spending against budget limits per category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgetUtilization.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No spending data yet</p>
                ) : (
                  budgetUtilization.map(cat => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{cat.category}</span>
                        <div className="text-right">
                          <span className="text-sm font-bold">{formatCurrency(cat.spent)}</span>
                          <span className="text-xs text-muted-foreground"> / {formatCurrency(cat.budgeted)}</span>
                        </div>
                      </div>
                      <Progress 
                        value={cat.percentUsed} 
                        className={cn(
                          "h-3",
                          cat.percentUsed > 100 ? "bg-red-100" : cat.percentUsed > 80 ? "bg-amber-100" : "bg-green-100"
                        )} 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{cat.percentUsed.toFixed(1)}% used</span>
                        <span className={cat.variance < 0 ? "text-red-600" : "text-green-600"}>
                          {cat.variance >= 0 ? `${formatCurrency(cat.variance)} remaining` : `${formatCurrency(Math.abs(cat.variance))} over budget`}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!activeBudget && !isLoadingBudgets && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PiggyBank className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Active Budget</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Create a budget period to start tracking spending against planned limits.
            </p>
            {canManage && (
              <Button onClick={() => { resetForm(); setShowForm(true); }} className="btn-omuto">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Budget
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Budgets List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Budget Periods</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingBudgets ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : budgets && budgets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map(budget => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">{budget.name}</TableCell>
                    <TableCell className="text-sm">
                      {formatDateSafe(budget.startDate, 'dateOnly')} - {formatDateSafe(budget.endDate, 'dateOnly')}
                    </TableCell>
                    <TableCell>{formatCurrency(budget.totalBudget)}</TableCell>
                    <TableCell>
                      <Badge variant={budget.isActive ? 'default' : 'secondary'}>
                        {budget.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!budget.isActive && canManage && (
                          <Button variant="outline" size="sm" onClick={() => setActiveBudget(budget.id)}>
                            Set Active
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No budgets created yet</p>
          )}
        </CardContent>
      </Card>

      {/* Budget Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBudget ? 'Edit Budget' : 'Create New Budget'}</DialogTitle>
            <DialogDescription>
              Set budget limits for a specific period. You can set overall limits or per-category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Budget Name</Label>
                <Input 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Q1 2026"
                />
              </div>
              <div>
                <Label>Total Budget (UGX)</Label>
                <Input 
                  type="number"
                  value={form.totalBudget} 
                  onChange={e => setForm({ ...form, totalBudget: e.target.value })}
                  placeholder="5000000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input 
                  type="date"
                  value={form.startDate} 
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input 
                  type="date"
                  value={form.endDate} 
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Category Limits (Optional)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                {expenseItemCategories.map(cat => (
                  <div key={cat} className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder={cat}
                      value={form.categoryLimits[cat] || ''}
                      onChange={e => setForm({
                        ...form,
                        categoryLimits: { ...form.categoryLimits, [cat]: e.target.value }
                      })}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingBudget ? 'Update' : 'Create'} Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
