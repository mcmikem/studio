'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import type { Expense } from '@/lib/types';
import { expenseItemCategories } from '@/lib/types';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import { Banknote, PlusCircle, Loader2, Sparkles, TrendingUp, History, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { FormShell, FormField, FormSection } from '@/components/ui/form-shell';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { createSystemAlert } from '@/lib/notifications';

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
      await createSystemAlert(firestore, {
        type: 'Info',
        priority: 'Low',
        message: `${profile.name} logged a petty cash expense: ${form.title} (UGX ${form.amount})`,
        creatorId: user.uid,
        action: '/finance/petty-cash'
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
    <div className="container max-w-5xl py-8 space-y-8">
      <PageHeader 
        icon={Banknote}
        title="Petty Cash Desk"
        description="Record small, routine operational expenses under 50,000 UGX."
        breadcrumbs={[
            { name: 'Finance', href: '/finance' },
            { name: 'Petty Cash', href: '/finance/petty-cash' }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 border-2 shadow-xl rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-amber-50 to-white border-amber-100">
            <CardContent className="p-8 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700/60 mb-2">Total Reimbursable</p>
                    {isLoading ? <Skeleton className="h-10 w-40" /> : (
                        <h2 className="text-4xl font-black text-omuto-navy italic tracking-tighter tabular-nums leading-none">
                            {formatCurrency(totalPettyCash)}
                        </h2>
                    )}
                    <div className="flex items-center gap-2 mt-4">
                        <Badge variant="outline" className="rounded-full bg-white border-amber-200 text-amber-700 font-bold px-3">
                            {pettyCash.length} Records
                        </Badge>
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Across all programs</span>
                    </div>
                </div>
                <div className="h-20 w-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center rotate-12">
                    <TrendingUp className="h-10 w-10 text-amber-500" />
                </div>
            </CardContent>
        </Card>

        <Card className="border-2 shadow-comic-sm rounded-[2.5rem] bg-primary flex flex-col justify-center p-8 hover:shadow-comic transition-all cursor-pointer group" onClick={() => setShowForm(true)}>
            <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PlusCircle className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Log Expense</h3>
            <p className="text-white/60 text-xs font-bold mt-1">Instant reconciliation</p>
        </Card>
      </div>

      <FormSection title="Transaction History" icon={History} defaultOpen={true}>
        <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-0">
                <div className="sm:hidden divide-y divide-black/5">
                    {isLoading && Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-6 space-y-3">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-6 w-48" />
                        </div>
                    ))}
                    {pettyCash.map(expense => (
                        <div key={expense.id} className="p-6 active:bg-muted/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="rounded-lg border-2 font-black uppercase tracking-widest text-[9px]">
                                    {expense.items[0]?.category}
                                </Badge>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{formatDateSafe(expense.date, 'dateOnly')}</span>
                            </div>
                            <h4 className="font-black text-omuto-navy uppercase italic tracking-tighter mb-1">{expense.title}</h4>
                            <p className="text-xl font-black text-primary tabular-nums italic leading-none">{formatCurrency(expense.totalAmount)}</p>
                        </div>
                    ))}
                </div>

                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted/30 border-b">
                                <th className="p-6 text-left text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Date</th>
                                <th className="p-6 text-left text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Description</th>
                                <th className="p-6 text-left text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Category</th>
                                <th className="p-6 text-right text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {pettyCash.map(expense => (
                                <tr key={expense.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-6 text-xs font-bold text-omuto-navy/60 tabular-nums">
                                        {formatDateSafe(expense.date, 'dateOnly')}
                                    </td>
                                    <td className="p-6 font-black text-omuto-navy uppercase italic tracking-tighter">
                                        {expense.title}
                                    </td>
                                    <td className="p-6">
                                        <Badge variant="outline" className="rounded-lg border-2 border-black/5 font-black uppercase tracking-widest text-[9px] px-3">
                                            {expense.items[0]?.category}
                                        </Badge>
                                    </td>
                                    <td className="p-6 text-right font-black text-omuto-navy tabular-nums">
                                        {formatCurrency(expense.totalAmount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
      </FormSection>

      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-[3rem] p-0 overflow-hidden border-t-4 border-primary">
            <FormShell onSubmit={handleSubmit} hideDefaultButtons={true}>
                <div className="p-8 border-b bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary rounded-2xl text-white">
                            <Receipt className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl uppercase tracking-tighter italic text-omuto-navy">Log Petty Cash</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Quick Expense Entry</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                    <FormField>
                        <Label className="text-xs font-black uppercase tracking-widest text-omuto-navy/60 mb-3 block">Description *</Label>
                        <Input 
                            value={form.title} 
                            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} 
                            placeholder="e.g., Office Stationery" 
                            className="h-14 rounded-2xl border-2 border-black/5 px-6 font-bold bg-muted/20 focus:border-primary/20 transition-all"
                        />
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField>
                            <Label className="text-xs font-black uppercase tracking-widest text-omuto-navy/60 mb-3 block">Amount (UGX) *</Label>
                            <Input 
                                type="number" 
                                value={form.amount} 
                                onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))} 
                                placeholder="Max 50,000" 
                                className="h-14 rounded-2xl border-2 border-black/5 px-6 font-bold bg-muted/20 tabular-nums"
                            />
                        </FormField>
                        <FormField>
                            <Label className="text-xs font-black uppercase tracking-widest text-omuto-navy/60 mb-3 block">Category *</Label>
                            <Select value={form.category} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
                                <SelectTrigger className="h-14 rounded-2xl border-2 border-black/5 px-6 font-bold bg-muted/20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-2 shadow-xl">
                                    {expenseItemCategories.slice(0, 10).map(c => (
                                        <SelectItem key={c} value={c} className="font-bold py-3">{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    </div>

                    <div className="p-6 bg-amber-50 border-2 border-amber-100 rounded-3xl">
                        <div className="flex gap-3">
                            <Sparkles className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                                <p className="text-xs font-black text-amber-800 uppercase tracking-widest">Instant Reimbursement</p>
                                <p className="text-[11px] font-bold text-amber-700/70 mt-1 leading-relaxed">
                                    Expenses under 50k are auto-acknowledged and processed for reimbursement without manual approval.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-muted/30 border-t flex gap-3">
                    <Button variant="outline" type="button" onClick={() => setShowForm(false)} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest border-2">Cancel</Button>
                    <Button 
                        type="submit"
                        disabled={isSubmitting || !form.title || !form.amount}
                        className="btn-omuto flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px]"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Recording...</>
                        ) : (
                            <><PlusCircle className="mr-2 h-5 w-5" /> Log Expense</>
                        )}
                    </Button>
                </div>
            </FormShell>
        </SheetContent>
      </Sheet>
    </div>
  );
}
