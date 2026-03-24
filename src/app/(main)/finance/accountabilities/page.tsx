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
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Clock, User as UserIcon,
  ArrowRight, PlusCircle, Loader2, Eye
} from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-amber-500" />
            Accountabilities
          </h1>
          <p className="text-muted-foreground">Track funds held by staff and their accountability status.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" /> Total Unaccounted
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalUnaccounted)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              <UserIcon className="h-3.5 w-3.5" /> Staff with Funds
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : (
              <p className="text-2xl font-bold">{staffCount}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Fully Accounted
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : (
              <p className="text-2xl font-bold text-emerald-600">{(allExpenses?.filter(e => e.type === 'Requisition' && e.status === 'Acknowledged').length || 0)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff Accountability List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Staff Accountabilities</CardTitle>
          <CardDescription>Each row shows a staff member's funds that need to be accounted for.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile View */}
          <div className="sm:hidden space-y-3">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            {!isLoading && staffAccountabilities.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">All staff have fully accounted for their funds.</p>
            )}
            {staffAccountabilities.map(staff => (
              <Card key={staff.userId} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base truncate">{staff.userName}</CardTitle>
                    <Badge variant="outline" className={staff.balance > 0 ? 'bg-amber-500/10 text-amber-600 border-amber-200' : 'bg-emerald-500/10 text-emerald-600 border-emerald-200'}>
                      {staff.balance > 0 ? 'Pending' : 'Clear'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disbursed</span>
                    <span className="font-bold">{formatCurrency(staff.totalDisbursed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accounted</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(staff.totalAccounted)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Balance Due</span>
                    <span className="font-bold text-amber-600">{formatCurrency(staff.balance)}</span>
                  </div>
                  {canManage && staff.balance > 0 && (
                    <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => { setSelectedStaff(staff); setShowAccountForm(true); }}>
                      Account for Funds
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead className="text-right">Disbursed</TableHead>
                  <TableHead className="text-right">Accounted</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))}
                {!isLoading && staffAccountabilities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
                        <p className="text-sm text-muted-foreground">All staff have fully accounted for their funds.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {staffAccountabilities.map(staff => (
                  <TableRow key={staff.userId}>
                    <TableCell className="font-medium">{staff.userName}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(staff.totalDisbursed)}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-bold">{formatCurrency(staff.totalAccounted)}</TableCell>
                    <TableCell className="text-right text-amber-600 font-bold">{formatCurrency(staff.balance)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={staff.balance > 0 ? 'bg-amber-500/10 text-amber-600 border-amber-200' : 'bg-emerald-500/10 text-emerald-600 border-emerald-200'}>
                        {staff.balance > 0 ? 'Pending' : 'Clear'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && staff.balance > 0 && (
                        <Button size="sm" variant="outline" onClick={() => { setSelectedStaff(staff); setShowAccountForm(true); }}>
                          Account
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account for Funds</DialogTitle>
            <DialogDescription>
              Record how funds from {selectedStaff?.userName} were spent. Balance due: {formatCurrency(selectedStaff?.balance || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={accountForm.title}
                onChange={e => setAccountForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Field visit transport"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (UGX)</Label>
              <Input
                type="number"
                value={accountForm.amount}
                onChange={e => setAccountForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={accountForm.category}
                onChange={e => setAccountForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {expenseItemCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={accountForm.description}
                onChange={e => setAccountForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe how the funds were used"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccountForm(false)}>Cancel</Button>
            <Button onClick={handleAccountForFunds} disabled={isSubmitting || !accountForm.title || !accountForm.amount}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Accountability
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
