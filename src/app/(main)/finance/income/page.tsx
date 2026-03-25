'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import type { Income } from '@/lib/types';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, ArrowUpCircle } from 'lucide-react';

const incomeTypes = ['Member Donations', 'Fundraising', 'In-kind Contributions', 'Grants', 'Partnerships', 'Omuto Essentials', 'Imac Enterprises', 'Other'] as const;

export default function IncomePage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [form, setForm] = useState({ source: '', amount: '', dateReceived: new Date().toISOString().split('T')[0], type: 'Grants', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incomeQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc')) : null, [firestore]);
  const { data: income, isLoading } = useCollection<Income>(incomeQuery);

  const totalIncome = useMemo(() => income?.reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0, [income]);

  const resetForm = () => {
    setForm({ source: '', amount: '', dateReceived: new Date().toISOString().split('T')[0], type: 'Grants', notes: '' });
    setEditingIncome(null);
  };

  const handleSubmit = async () => {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      const data = { ...form, amount: Number(form.amount), createdAt: serverTimestamp() };
      if (editingIncome) {
        await updateDocumentNonBlocking(doc(firestore, 'income', editingIncome.id), data);
        toast({ title: 'Income Updated' });
      } else {
        await addDocumentNonBlocking(collection(firestore, 'income'), data);
        toast({ title: 'Income Logged' });
      }
      setShowForm(false);
      resetForm();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save income.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: Income) => {
    setEditingIncome(item);
    setForm({ source: item.source, amount: String(item.amount), dateReceived: formatDateSafe(item.dateReceived, 'iso'), type: item.type, notes: item.notes || '' });
    setShowForm(true);
  };

  const handleDelete = async (item: Income) => {
    if (!firestore) return;
    await deleteDocumentNonBlocking(doc(firestore, 'income', item.id));
    toast({ title: 'Income Deleted' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
            <ArrowUpCircle className="h-8 w-8 text-emerald-500" />
            Income
          </h1>
          <p className="text-muted-foreground">Track all organizational income and funding sources.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Log Income
        </Button>
      </div>

      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Total Income</p>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-3xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</p>
            )}
          </div>
          <ArrowUpCircle className="h-12 w-12 text-emerald-500/20" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Income Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="sm:hidden space-y-3">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            {income?.map(item => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{item.source}</CardTitle>
                    <Badge variant="outline">{item.type}</Badge>
                  </div>
                  <CardDescription>{formatDateSafe(item.dateReceived, 'dateOnly')}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(item.amount)}</p>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))}
                {income?.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDateSafe(item.dateReceived, 'dateOnly')}</TableCell>
                    <TableCell className="font-medium">{item.source}</TableCell>
                    <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(item.amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIncome ? 'Edit Income' : 'Log New Income'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Source</Label>
              <Input 
                value={form.source} 
                onChange={e => setForm(prev => ({ ...prev, source: e.target.value }))} 
                placeholder="e.g., GlobalGiving Grant" 
                className="h-12 sm:h-14 text-sm sm:text-base font-medium"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Amount (UGX)</Label>
                <Input 
                  type="number" 
                  value={form.amount} 
                  onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="h-12 sm:h-14 text-sm sm:text-base font-medium" 
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Date Received</Label>
                <Input 
                  type="date" 
                  value={form.dateReceived} 
                  onChange={e => setForm(prev => ({ ...prev, dateReceived: e.target.value }))}
                  className="h-12 sm:h-14 text-sm sm:text-base font-medium" 
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(prev => ({ ...prev, type: v }))}>
                <SelectTrigger className="h-12 sm:h-14"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {incomeTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Notes</Label>
              <Textarea 
                value={form.notes} 
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} 
                placeholder="Optional notes..."
                className="min-h-[80px] sm:min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !form.source || !form.amount}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingIncome ? 'Update' : 'Log Income'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
