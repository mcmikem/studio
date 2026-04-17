'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import type { BankAccount } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { PageHeader } from '@/components/page-header';
import { Building2, PlusCircle, Edit, TrendingUp, TrendingDown, Wallet, Loader2, DollarSign } from 'lucide-react';

export default function BankAccountsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const financeRoles = ['Executive Director', 'Media & Finance Lead', 'Administrator', 'Media & Communications Lead'];
  const canManage = profile && financeRoles.includes(profile.role);

  const accountsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'bankAccounts'), orderBy('name')) : null, 
  [firestore]);
  const { data: accounts, isLoading } = useCollection<BankAccount>(accountsQuery);

  const totalBalance = useMemo(() => 
    accounts?.reduce((sum, acc) => sum + Number(acc.currentBalance || 0), 0) || 0,
  [accounts]);

  const [form, setForm] = useState({
    name: '',
    accountNumber: '',
    bankName: '',
    currency: 'UGX',
    openingBalance: '',
    currentBalance: '',
  });

  const resetForm = () => {
    setForm({
      name: '',
      accountNumber: '',
      bankName: '',
      currency: 'UGX',
      openingBalance: '',
      currentBalance: '',
    });
    setEditingAccount(null);
  };

  const handleSubmit = async () => {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      const data = {
        name: form.name,
        accountNumber: form.accountNumber,
        bankName: form.bankName,
        currency: form.currency,
        openingBalance: Number(form.openingBalance),
        currentBalance: Number(form.currentBalance) || Number(form.openingBalance),
        isActive: true,
        createdAt: serverTimestamp(),
      };

      if (editingAccount) {
        await updateDocumentNonBlocking(doc(firestore, 'bankAccounts', editingAccount.id), data);
        toast({ title: 'Account Updated' });
      } else {
        await addDocumentNonBlocking(collection(firestore, 'bankAccounts'), data);
        toast({ title: 'Account Created' });
      }
      setShowForm(false);
      resetForm();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save account.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBalance = async (accountId: string, newBalance: number) => {
    if (!firestore) return;
    try {
      await updateDocumentNonBlocking(doc(firestore, 'bankAccounts', accountId), {
        currentBalance: newBalance
      });
      toast({ title: 'Balance Updated' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update balance.' });
    }
  };

  return (
    <div className="space-y-6 pb-20 px-4 sm:px-0">
      <PageHeader
        icon={Building2}
        title="Bank Accounts"
        description="Track bank accounts and their balances for reconciliation."
      >
        {canManage && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="btn-omuto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Account
          </Button>
        )}
      </PageHeader>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Total Bank Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalBalance)}</p>
            <p className="text-xs text-muted-foreground">{accounts?.length || 0} accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" /> UGX Accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(accounts?.filter(a => a.currency === 'UGX').reduce((s, a) => s + Number(a.currentBalance || 0), 0) || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" /> USD Accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${accounts?.filter(a => a.currency === 'USD').reduce((s, a) => s + Number(a.currentBalance || 0), 0)?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{accounts?.filter(a => a.isActive).length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account List</CardTitle>
          <CardDescription>Manage your organization's bank accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : accounts && accounts.length > 0 ? (
            <div className="grid gap-4">
              {accounts.map(account => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center",
                      account.currency === 'UGX' ? "bg-green-100" : "bg-blue-100"
                    )}>
                      <Building2 className={cn("h-6 w-6", account.currency === 'UGX' ? "text-green-600" : "text-blue-600")} />
                    </div>
                    <div>
                      <p className="font-bold">{account.name}</p>
                      <p className="text-sm text-muted-foreground">{account.bankName} • {account.accountNumber || 'No account #'} {account.currency !== 'UGX' && `(${account.currency})`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-black">{account.currency === 'UGX' ? formatCurrency(account.currentBalance) : `$${Number(account.currentBalance || 0).toLocaleString()}`}</p>
                      <p className="text-xs text-muted-foreground">
                        Opening: {account.currency === 'UGX' ? formatCurrency(account.openingBalance) : `$${Number(account.openingBalance || 0).toLocaleString()}`}
                      </p>
                    </div>
                    <Badge variant={account.isActive ? 'default' : 'secondary'}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Bank Accounts</h3>
              <p className="text-muted-foreground mb-4">Add your first bank account to start tracking.</p>
              {canManage && (
                <Button onClick={() => { resetForm(); setShowForm(true); }} className="btn-omuto">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Account
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Account' : 'Add Bank Account'}</DialogTitle>
            <DialogDescription>
              Add a bank account to track its balance for financial reporting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account Name</Label>
                <Input 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Operating Account"
                />
              </div>
              <div>
                <Label>Bank Name</Label>
                <Input 
                  value={form.bankName} 
                  onChange={e => setForm({ ...form, bankName: e.target.value })}
                  placeholder="e.g., Stanbic Bank"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account Number</Label>
                <Input 
                  value={form.accountNumber} 
                  onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                  placeholder="e.g., 9030012345678"
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Opening Balance</Label>
                <Input 
                  type="number"
                  value={form.openingBalance} 
                  onChange={e => setForm({ ...form, openingBalance: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Current Balance</Label>
                <Input 
                  type="number"
                  value={form.currentBalance || form.openingBalance} 
                  onChange={e => setForm({ ...form, currentBalance: e.target.value })}
                  placeholder="Same as opening"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingAccount ? 'Update' : 'Add'} Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
