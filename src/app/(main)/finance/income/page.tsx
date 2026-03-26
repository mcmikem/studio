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
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import type { Income } from '@/lib/types';
import { formatCurrency, formatDateSafe, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Loader2, PlusCircle, Edit, Trash2, ArrowUpCircle, Check, X } from 'lucide-react';

const incomeTypes = ['Member Donations', 'Fundraising', 'In-kind Contributions', 'Grants', 'Partnerships', 'Omuto Essentials', 'Imac Enterprises', 'Other'] as const;

const statusColors: Record<string, string> = {
  Pending: 'border-yellow-500 bg-yellow-500/10 text-yellow-600',
  Approved: 'border-green-500 bg-green-500/10 text-green-600',
  Rejected: 'border-red-500 bg-red-500/10 text-red-600',
};

export default function IncomePage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [form, setForm] = useState({ 
    source: '', 
    amount: '', 
    dateReceived: new Date().toISOString().split('T')[0], 
    type: 'Grants', 
    notes: '',
    status: 'Approved' as 'Pending' | 'Approved' | 'Rejected'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incomeQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc')) : null, [firestore]);
  const { data: income, isLoading } = useCollection<Income>(incomeQuery);

  // Only ED, Admin, Finance roles can approve/reject income
  const approvalRoles = ['Executive Director', 'Administrator', 'Media & Finance Lead', 'Media & Communications Lead'];
  const canApprove = profile && approvalRoles.includes(profile.role);

  // Filter by status
  const pending = useMemo(() => income?.filter(i => i.status === 'Pending') || [], [income]);
  const approved = useMemo(() => income?.filter(i => i.status === 'Approved') || [], [income]);
  const rejected = useMemo(() => income?.filter(i => i.status === 'Rejected') || [], [income]);

  const totalPending = useMemo(() => pending.reduce((sum, i) => sum + Number(i.amount || 0), 0), [pending]);
  const totalApproved = useMemo(() => approved.reduce((sum, i) => sum + Number(i.amount || 0), 0), [approved]);
  const totalIncome = useMemo(() => income?.reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0, [income]);

  const resetForm = () => {
    setForm({ source: '', amount: '', dateReceived: new Date().toISOString().split('T')[0], type: 'Grants', notes: '', status: 'Approved' });
    setEditingIncome(null);
  };

  const handleSubmit = async () => {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      const data = { 
        ...form, 
        amount: Number(form.amount), 
        createdAt: serverTimestamp(),
        // Ensure status is set
        status: form.status || 'Approved'
      };
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

  const handleStatusUpdate = async (item: Income, status: 'Approved' | 'Rejected') => {
    if (!firestore) return;
    try {
      await updateDocumentNonBlocking(doc(firestore, 'income', item.id), { status });
      toast({ title: `Income ${status}` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  };

  const handleEdit = (item: Income) => {
    setEditingIncome(item);
    setForm({ 
      source: item.source, 
      amount: String(item.amount), 
      dateReceived: formatDateSafe(item.dateReceived, 'iso'), 
      type: item.type, 
      notes: item.notes || '',
      status: (item.status as 'Pending' | 'Approved' | 'Rejected') || 'Approved'
    });
    setShowForm(true);
  };

  const handleDelete = async (item: Income) => {
    if (!firestore) return;
    await deleteDocumentNonBlocking(doc(firestore, 'income', item.id));
    toast({ title: 'Income Deleted' });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
            <ArrowUpCircle className="h-8 w-8 text-emerald-500" />
            Income
          </h1>
          <p className="text-muted-foreground">Track and manage all organizational income sources.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="btn-omuto shadow-comic-sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Income
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Income</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-yellow-500" /> Pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Approved
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalApproved)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Rejected</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-red-600">{formatCurrency(rejected.reduce((s, i) => s + Number(i.amount || 0), 0))}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Income List */}
      <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b bg-muted/30">
          <CardTitle className="text-xl font-black uppercase tracking-tight text-omuto-navy">All Income</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Complete audit log</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="sm:hidden divide-y divide-omuto-navy/5">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-6"><Skeleton className="h-24 w-full rounded-2xl" /></div>)}
            {income?.map(item => (
              <div key={item.id} className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1 mr-3">
                    <h4 className="font-bold text-omuto-navy truncate">{item.source}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-wider">{item.type} · {formatDateSafe(item.dateReceived, 'dateOnly')}</p>
                  </div>
                  <Badge variant="outline" className={cn('px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest', statusColors[item.status || 'Approved'])}>
                    {item.status || 'Approved'}
                  </Badge>
                </div>
                <p className="text-2xl font-black tracking-tighter text-emerald-600">{formatCurrency(item.amount)}</p>
                <div className="flex gap-2 justify-end pt-2">
                  {canApprove && item.status === 'Pending' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(item, 'Approved')} className="flex-1 h-11 border-2 border-emerald-500/50 text-emerald-600 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-50 rounded-xl">Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(item, 'Rejected')} className="flex-1 h-11 border-2 border-rose-500/50 text-rose-600 font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 rounded-xl text-center">Reject</Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(item)} className="h-9"><Edit className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(item)} className="h-9 text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-none">
                  <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Source</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Type</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Date</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Status</TableHead>
                  <TableHead className="py-5 text-right text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Amount</TableHead>
                  <TableHead className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6} className="p-8 text-center"><Skeleton className="h-6 w-full rounded-lg" /></TableCell></TableRow>
                ))}
                {income?.map(item => (
                  <TableRow key={item.id} className="hover:bg-muted/20 border-omuto-navy/5 transition-colors">
                    <TableCell className="px-8 py-6">
                      <p className="font-bold text-omuto-navy">{item.source}</p>
                      {item.notes && <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{item.notes}</p>}
                    </TableCell>
                    <TableCell className="py-6">
                      <span className="text-sm font-medium text-omuto-navy">{item.type}</span>
                    </TableCell>
                    <TableCell className="py-6">
                      <span className="text-sm font-medium text-muted-foreground">{formatDateSafe(item.dateReceived, 'dateOnly')}</span>
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge variant="outline" className={cn('px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider', statusColors[item.status || 'Approved'])}>
                        {item.status || 'Approved'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 text-right font-black text-lg tracking-tight text-emerald-600">{formatCurrency(item.amount)}</TableCell>
                    <TableCell className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {canApprove && item.status === 'Pending' && (
                          <>
                            <Button size="icon" variant="outline" className="h-10 w-10 border-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 rounded-xl" onClick={() => handleStatusUpdate(item, 'Approved')}><Check className="h-5 w-5" /></Button>
                            <Button size="icon" variant="outline" className="h-10 w-10 border-2 border-rose-500/30 text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => handleStatusUpdate(item, 'Rejected')}><X className="h-5 w-5" /></Button>
                          </>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(item)} className="h-10 w-10 rounded-xl"><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(item)} className="h-10 w-10 rounded-xl text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingIncome ? 'Edit Income' : 'Add Income'}</DialogTitle>
            <DialogDescription>Record a new income source for the organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Input value={form.source} onChange={e => setForm({...form, source: e.target.value})} placeholder="e.g., USAID Grant" />
              </div>
              <div className="space-y-2">
                <Label>Amount (UGX)</Label>
                <Input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {incomeTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date Received</Label>
                <Input type="date" value={form.dateReceived} onChange={e => setForm({...form, dateReceived: e.target.value})} />
              </div>
            </div>
            {canApprove && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v as 'Pending' | 'Approved' | 'Rejected'})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Pending">Pending Approval</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Additional details..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !form.source || !form.amount}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingIncome ? 'Update' : 'Add'} Income
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}