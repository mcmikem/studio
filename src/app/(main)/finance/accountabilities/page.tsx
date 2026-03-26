'use client';

import { useMemo, useState } from 'react';
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, where, doc, serverTimestamp } from 'firebase/firestore';
import type { Expense, User } from '@/lib/types';
import { expenseItemCategories } from '@/lib/types';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Clock, User as UserIcon,
  PlusCircle, Loader2, Wallet, Users, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffAccountability {
  userId: string;
  userName: string;
  totalDisbursed: number;
  totalAccounted: number;
  totalPending: number;
  balance: number;
  expenses: Expense[];
}

export default function AccountabilitiesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();

  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: allExpenses, isLoading } = useCollection<Expense>(expensesQuery);

  const [selectedStaff, setSelectedStaff] = useState<StaffAccountability | null>(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountForm, setAccountForm] = useState({ title: '', amount: '', category: 'Transport' as string, description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const financeRoles = ['Executive Director', 'Media & Finance Lead', 'Administrator', 'Media & Communications Lead'];
  const canManage = profile && financeRoles.includes(profile.role);

  const staffAccountabilities = useMemo((): StaffAccountability[] => {
    if (!allExpenses) return [];

    const staffMap = new Map<string, StaffAccountability>();

    // Get all disbursed requisitions (money given to staff)
    allExpenses
      .filter(e => e.type === 'Requisition' && e.status === 'Disbursed')
      .forEach(e => {
        const existing = staffMap.get(e.userId);
        if (existing) {
          existing.totalDisbursed += Number(e.totalAmount || 0);
          existing.expenses.push(e);
        } else {
          staffMap.set(e.userId, {
            userId: e.userId,
            userName: e.userName,
            totalDisbursed: Number(e.totalAmount || 0),
            totalAccounted: 0,
            totalPending: 0,
            balance: 0,
            expenses: [e],
          });
        }
      });

    // Get all acknowledged expenses (money accounted for)
    allExpenses
      .filter(e => (e.status === 'Acknowledged' || e.status === 'Disbursed') && e.type === 'Requisition')
      .forEach(e => {
        const staff = staffMap.get(e.userId);
        if (staff && e.status === 'Acknowledged') {
          staff.totalAccounted += Number(e.totalAmount || 0);
        }
      });

    // Calculate balances
    staffMap.forEach(staff => {
      staff.totalPending = staff.totalDisbursed - staff.totalAccounted;
      staff.balance = staff.totalDisbursed - staff.totalAccounted;
    });

    return Array.from(staffMap.values())
      .filter(s => s.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [allExpenses]);

  const totalUnaccounted = staffAccountabilities.reduce((sum, s) => sum + s.balance, 0);
  const staffCount = staffAccountabilities.length;

  const handleAccountForFunds = async () => {
    if (!firestore || !user || !profile || !selectedStaff) return;
    setIsSubmitting(true);

    try {
      const expenseData = {
        userId: user.uid,
        userName: profile.name,
        title: accountForm.title,
        date: new Date().toISOString().split('T')[0],
        items: [{ description: accountForm.description || accountForm.title, category: accountForm.category, amount: Number(accountForm.amount) }],
        totalAmount: Number(accountForm.amount),
        type: 'Requisition' as const,
        status: 'Acknowledged' as const,
        createdAt: serverTimestamp(),
      };

      await addDocumentNonBlocking(collection(firestore, 'expenses'), expenseData);

      toast({
        title: 'Accountability Submitted',
        description: `${formatCurrency(Number(accountForm.amount))} has been accounted for.`,
      });

      setShowAccountForm(false);
      setAccountForm({ title: '', amount: '', category: 'Transport', description: '' });
      setSelectedStaff(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit accountability.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Accountabilities"
        description="Monitor funds held by the team. Ensure every shilling disbursed is accounted for with receipts."
        icon={ShieldCheck}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-2 border-amber-500/20 bg-amber-500/5 rounded-[2.5rem] shadow-xl overflow-hidden">
          <CardContent className="p-8 flex items-center gap-4">
            <div className="p-4 bg-amber-500/20 rounded-2xl text-amber-600"><AlertTriangle className="h-8 w-8" /></div>
            <div>
                <p className="text-3xl font-black text-amber-600 leading-tight">{isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totalUnaccounted)}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/50">Total Unaccounted</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-omuto-navy/10 bg-card rounded-[2.5rem] shadow-xl overflow-hidden">
          <CardContent className="p-8 flex items-center gap-4">
            <div className="p-4 bg-omuto-navy/5 rounded-2xl text-omuto-navy/60"><Users className="h-8 w-8" /></div>
            <div>
                <p className="text-3xl font-black text-omuto-navy leading-tight">{isLoading ? <Skeleton className="h-8 w-12" /> : staffCount}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/40">Staff with Funds</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-500/20 bg-emerald-500/5 rounded-[2.5rem] shadow-xl overflow-hidden">
          <CardContent className="p-8 flex items-center gap-4">
            <div className="p-4 bg-emerald-500/20 rounded-2xl text-emerald-600"><CheckCircle2 className="h-8 w-8" /></div>
            <div>
                <p className="text-3xl font-black text-emerald-600 leading-tight">
                    {isLoading ? <Skeleton className="h-8 w-12" /> : (allExpenses?.filter(e => e.type === 'Requisition' && e.status === 'Acknowledged').length || 0)}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50">Settled Logs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Accountability List */}
      <Card className="border-2 shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b bg-muted/30">
          <CardTitle className="text-xl font-black uppercase tracking-tight text-omuto-navy">Team Balances</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Pending retirements and fund balances per staff member</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile View */}
          <div className="sm:hidden divide-y divide-omuto-navy/5 px-6">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="py-6"><Skeleton className="h-32 w-full rounded-2xl" /></div>)}
            {!isLoading && staffAccountabilities.length === 0 && (
              <div className="py-20 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500/20 mx-auto mb-4" />
                  <p className="text-sm font-bold text-omuto-navy/40 uppercase tracking-widest">A clean slate! All funds accounted for.</p>
              </div>
            )}
            {staffAccountabilities.map(staff => (
              <div key={staff.userId} className="py-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-omuto-navy">{staff.userName}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Staff Terminal</p>
                    </div>
                    <Badge variant="outline" className={cn('px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider', staff.balance > 0 ? 'bg-amber-500/10 text-amber-600 border-amber-200' : 'bg-emerald-500/10 text-emerald-600 border-emerald-200')}>
                      {staff.balance > 0 ? 'Due' : 'Clear'}
                    </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border border-omuto-navy/5">
                    <div>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Disbursed</p>
                        <p className="font-bold text-sm">{formatCurrency(staff.totalDisbursed)}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Accounted</p>
                        <p className="font-bold text-sm text-emerald-600">{formatCurrency(staff.totalAccounted)}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Balance Due</p>
                        <p className="text-xl font-black text-amber-600 tracking-tight">{formatCurrency(staff.balance)}</p>
                    </div>
                    {canManage && staff.balance > 0 && (
                        <Button size="sm" variant="default" className="bg-omuto-navy text-white font-black uppercase tracking-widest text-[10px] h-11 px-6 rounded-xl shadow-lg" onClick={() => { setSelectedStaff(staff); setShowAccountForm(true); }}>
                        Retire Funds
                        </Button>
                    )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-none">
                  <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Staff Member</TableHead>
                  <TableHead className="py-5 text-right text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Disbursed</TableHead>
                  <TableHead className="py-5 text-right text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Accounted</TableHead>
                  <TableHead className="py-5 text-right text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Balance Due</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Status</TableHead>
                  <TableHead className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-omuto-navy/50">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6} className="p-8 text-center"><Skeleton className="h-6 w-full rounded-xl" /></TableCell></TableRow>
                ))}
                {!isLoading && staffAccountabilities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500/20" />
                        <p className="text-sm font-bold text-omuto-navy/40 uppercase tracking-widest">All staff have fully accounted for their funds.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {staffAccountabilities.map(staff => (
                  <TableRow key={staff.userId} className="hover:bg-muted/10 border-omuto-navy/5 transition-colors">
                    <TableCell className="px-8 py-6 font-bold text-omuto-navy">{staff.userName}</TableCell>
                    <TableCell className="py-6 text-right font-bold text-muted-foreground">{formatCurrency(staff.totalDisbursed)}</TableCell>
                    <TableCell className="py-6 text-right text-emerald-600 font-bold">{formatCurrency(staff.totalAccounted)}</TableCell>
                    <TableCell className="py-6 text-right text-amber-600 font-black text-lg tracking-tight">{formatCurrency(staff.balance)}</TableCell>
                    <TableCell className="py-6 text-center">
                      <Badge variant="outline" className={cn('px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider', staff.balance > 0 ? 'bg-amber-500/10 text-amber-600 border-amber-200' : 'bg-emerald-500/10 text-emerald-600 border-emerald-200')}>
                        {staff.balance > 0 ? 'Due' : 'Clear'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right">
                      {canManage && staff.balance > 0 && (
                        <Button size="sm" variant="default" className="bg-omuto-navy hover:bg-black text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-lg" onClick={() => { setSelectedStaff(staff); setShowAccountForm(true); }}>
                          Retire Funds
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      {/* Account for Funds Dialog */}
      <Dialog open={showAccountForm} onOpenChange={setShowAccountForm}>
        <DialogContent className="sm:max-w-md border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-muted/30 border-b">
            <DialogTitle className="font-black uppercase tracking-tight text-omuto-navy">Retire Funds</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Record expenditure for {selectedStaff?.userName}. Current balance: <span className="text-amber-600">{formatCurrency(selectedStaff?.balance || 0)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50 pl-1">Expenditure Title</Label>
              <Input
                value={accountForm.title}
                onChange={e => setAccountForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Field visit transport"
                className="h-14 rounded-2xl border-2 font-bold text-omuto-navy text-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50 pl-1">Amount (UGX)</Label>
                    <Input
                        type="number"
                        value={accountForm.amount}
                        onChange={e => setAccountForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="h-14 rounded-2xl border-2 font-black text-omuto-navy text-lg"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50 pl-1">Category</Label>
                    <select
                        value={accountForm.category}
                        onChange={e => setAccountForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full h-14 px-4 rounded-2xl border-2 bg-background font-bold text-omuto-navy text-sm appearance-none"
                    >
                        {expenseItemCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-omuto-navy/50 pl-1">Description / Notes</Label>
              <Textarea
                value={accountForm.description}
                onChange={e => setAccountForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Briefly describe how the funds were used..."
                className="min-h-[100px] rounded-2xl border-2 font-medium"
              />
            </div>
          </div>
          <DialogFooter className="p-8 bg-muted/30 border-t flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setShowAccountForm(false)} className="h-12 rounded-xl font-bold uppercase tracking-widest text-xs">Cancel</Button>
            <Button onClick={handleAccountForFunds} disabled={isSubmitting || !accountForm.title || !accountForm.amount} className="h-12 rounded-xl font-black uppercase tracking-widest text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex-1">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Retirement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
