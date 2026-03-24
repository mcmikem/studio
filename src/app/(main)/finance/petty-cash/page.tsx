'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import type { Expense } from '@/lib/types';
import { expenseItemCategories } from '@/lib/types';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import { Banknote, PlusCircle, Loader2 } from 'lucide-react';

export default function PettyCashPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'Transport' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: allExpenses, isLoading } = useCollection<Expense>(expensesQuery);

  const pettyCash = useMemo(() =>
    allExpenses?.filter(e =>
      e.status === 'Acknowledged' &&
      Number(e.totalAmount || 0) <= 50000
    ) || [],
    [allExpenses]
  );

  const totalPettyCash = pettyCash.reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);

  const handleSubmit = async () => {
    if (!firestore || !user || !profile) return;
    setIsSubmitting(true);
    try {
      await addDocumentNonBlocking(collection(firestore, 'expenses'), {
        userId: user.uid,
        userName: profile.name,
        title: form.title,
        date: new Date().toISOString().split('T')[0],
        items: [{ description: form.title, category: form.category, amount: Number(form.amount) }],
        totalAmount: Number(form.amount),
        type: 'Reimbursement',
        status: 'Acknowledged',
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Petty Cash Logged' });
      setShowForm(false);
      setForm({ title: '', amount: '', category: 'Transport' });
    } catch {
      toast({ variant: 'destructive', title: 'Error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
            <Banknote className="h-8 w-8 text-amber-500" />
            Petty Cash Expenses
          </h1>
          <p className="text-muted-foreground">Small, routine expenses under 50,000 UGX that don't require approval.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Log Petty Cash
        </Button>
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-700">Total Petty Cash</p>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-3xl font-bold text-amber-700">{formatCurrency(totalPettyCash)}</p>
            )}
            <p className="text-xs text-amber-600 mt-1">{pettyCash.length} entries</p>
          </div>
          <Banknote className="h-12 w-12 text-amber-500/20" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Petty Cash History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="sm:hidden space-y-3">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            {pettyCash.map(expense => (
              <Card key={expense.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base truncate">{expense.title}</CardTitle>
                    <Badge variant="outline">{expense.items[0]?.category}</Badge>
                  </div>
                  <CardDescription>{formatDateSafe(expense.date, 'dateOnly')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">{formatCurrency(expense.totalAmount)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="hidden sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {pettyCash.map(expense => (
                  <tr key={expense.id} className="border-b last:border-0">
                    <td className="py-3 text-sm">{formatDateSafe(expense.date, 'dateOnly')}</td>
                    <td className="py-3 font-medium">{expense.title}</td>
                    <td className="py-3"><Badge variant="outline">{expense.items[0]?.category}</Badge></td>
                    <td className="py-3 text-right font-bold">{formatCurrency(expense.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Petty Cash Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="What was this for?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (UGX)</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))} placeholder="Max 50,000" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {expenseItemCategories.slice(0, 10).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !form.title || !form.amount}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
