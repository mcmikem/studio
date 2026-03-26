
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, Timestamp, doc } from 'firebase/firestore';
import type { Income, Expense, User, ExpenseItem } from '@/lib/types';
import { expenseItemCategories } from '@/lib/types';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { DollarSign, PlusCircle, ArrowUpCircle, ArrowDownCircle, Loader2, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDateSafe, formatCurrency } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useUserProfile } from '@/hooks/use-user-profile';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { Wallet, CreditCard, ArrowUpRight, ArrowDownRight, TrendingUp, History } from 'lucide-react';

const incomeSchema = z.object({
  source: z.string().min(3, 'Source is required.'),
  amount: z.coerce.number().min(1, 'Amount must be greater than zero.'),
  dateReceived: z.string().min(1, 'Date is required.'),
  type: z.enum(['Member Donations', 'Fundraising', 'In-kind Contributions', 'Grants', 'Partnerships', 'Omuto Essentials', 'Imac Enterprises', 'Other']),
  notes: z.string().optional(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

const directExpenseSchema = z.object({
  title: z.string().min(3, 'A title for the expense is required.'),
  amount: z.coerce.number().min(1, 'Amount must be greater than zero.'),
  date: z.string().min(1, 'Date is required.'),
  category: z.enum(expenseItemCategories as unknown as [string, ...string[]]),
  submittedFor: z.string().optional(),
  otherUserName: z.string().optional(),
}).refine(data => {
    if ((data.submittedFor === 'Volunteer' || data.submittedFor === 'Intern') && !data.otherUserName) {
        return false;
    }
    return true;
}, {
    message: "Please specify the name for the selected role.",
    path: ["otherUserName"],
});


type DirectExpenseFormData = z.infer<typeof directExpenseSchema>;


function IncomeForm({ income, onFormSubmit }: { income?: Income | null; onFormSubmit: () => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const isEditMode = !!income;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: isEditMode && income
  ? {
      ...(income as any), // allow any extra fields
      // explicitly cast type so TS is happy
      type: (income.type as any) ?? 'Grants',
      dateReceived: formatDateSafe(income.dateReceived, 'iso'),
    }
  : {
      type: 'Grants',
      dateReceived: format(new Date(), 'yyyy-MM-dd'),
    },
});


  const onSubmit = (data: IncomeFormData) => {
    if (!firestore) return;

    const incomeData = { ...data, dateReceived: data.dateReceived };

    if (isEditMode && income) {
        const docRef = doc(firestore, 'income', income.id);
        updateDocumentNonBlocking(docRef, incomeData);
        toast({ title: "Income Updated!", description: `${formatCurrency(data.amount)} from ${data.source} has been updated.`});
    } else {
        const newIncome = { ...incomeData, createdAt: serverTimestamp() };
        addDocumentNonBlocking(collection(firestore, 'income'), newIncome);
        toast({ title: 'Income Logged!', description: `${formatCurrency(data.amount)} from ${data.source} has been recorded.` });
    }
    
    reset();
    onFormSubmit();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Input id="source" {...register('source')} placeholder="e.g., GlobalGiving Grant" />
          {errors.source && <p className="text-sm text-destructive">{errors.source.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (UGX)</Label>
          <Input id="amount" type="number" {...register('amount')} placeholder="e.g., 5000000" />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateReceived">Date Received</Label>
          <Input id="dateReceived" type="date" {...register('dateReceived')} />
          {errors.dateReceived && <p className="text-sm text-destructive">{errors.dateReceived.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Income Type</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Member Donations">Member Donations</SelectItem>
                  <SelectItem value="Fundraising">Fundraising</SelectItem>
                  <SelectItem value="In-kind Contributions">In-kind Contributions</SelectItem>
                  <SelectItem value="Grants">Grants</SelectItem>
                  <SelectItem value="Partnerships">Partnerships</SelectItem>
                  <SelectItem value="Omuto Essentials">Omuto Essentials</SelectItem>
                  <SelectItem value="Imac Enterprises">Imac Enterprises</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
       <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea id="notes" {...register('notes')} placeholder="e.g., First tranche of the Youth Empowerment grant." />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Save Changes' : 'Log Income'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ExpenseForm({ expense, onFormSubmit }: { expense?: Expense | null, onFormSubmit: () => void }) {
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();
  const firestore = useFirestore();
  const isEditMode = !!expense;

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const financeRoles = ['Executive Director', 'Media & Finance Lead', 'Administrator', 'Media & Communications Lead'];
  const canSubmitForOthers = profile && financeRoles.includes(profile.role);


  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<DirectExpenseFormData>({
    resolver: zodResolver(directExpenseSchema),
    defaultValues: isEditMode && expense ? {
        title: expense.title,
        amount: expense.totalAmount,
        date: formatDateSafe(expense.date, 'iso'),
        category: expense.items[0]?.category || 'Transport',
        submittedFor: expense.userId
    } : {
      category: 'Rent',
      date: format(new Date(), 'yyyy-MM-dd'),
      submittedFor: user?.uid,
    },
  });

  const submittedForSelection = watch('submittedFor');

  const onSubmit = (data: DirectExpenseFormData) => {
    if (!firestore || !user || !profile) return;

    let expenseUserId = user.uid;
    let expenseUserName = profile.name;

    if (canSubmitForOthers && data.submittedFor) {
        if (data.submittedFor === 'Volunteer' || data.submittedFor === 'Intern') {
            expenseUserId = data.submittedFor.toLowerCase();
            expenseUserName = data.otherUserName || `${data.submittedFor} (unnamed)`;
        } else {
            const selectedUser = users?.find(u => u.id === data.submittedFor);
            if (selectedUser) {
                expenseUserId = selectedUser.id;
                expenseUserName = selectedUser.name;
            }
        }
    }
    
    const expenseData = {
      userId: expenseUserId,
      userName: expenseUserName,
      title: data.title,
      date: data.date,
      items: [{ description: data.title, category: data.category, amount: data.amount }],
      totalAmount: data.amount,
    };
    
    if (isEditMode && expense) {
        const docRef = doc(firestore, 'expenses', expense.id);
        updateDocumentNonBlocking(docRef, expenseData);
        toast({ title: 'Expense Updated!', description: `${formatCurrency(data.amount)} for ${data.title} has been updated.`});
    } else {
        const newExpenseData = {
          ...expenseData,
          type: 'Reimbursement' as const,
          status: 'Acknowledged' as const,
          createdAt: serverTimestamp(),
        };
        addDocumentNonBlocking(collection(firestore, 'expenses'), newExpenseData);
        toast({ title: 'Expense Logged!', description: `${formatCurrency(data.amount)} for ${data.title} has been recorded.`});
    }

    reset();
    onFormSubmit();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
       <div className="space-y-2">
        <Label htmlFor="title">Expense Description</Label>
        <Input id="title" {...register('title')} placeholder="e.g., Office Rent (Q4)" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
       {canSubmitForOthers && (
            <div className="space-y-2">
                <Label htmlFor="submittedFor">Submitted For</Label>
                 <Controller
                    name="submittedFor"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="submittedFor">
                            <SelectValue placeholder="Select user..." />
                        </SelectTrigger>
                        <SelectContent>
                             {users?.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                            ))}
                            <SelectItem value="Volunteer">Volunteer</SelectItem>
                            <SelectItem value="Intern">Intern</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                />
                 {(submittedForSelection === 'Volunteer' || submittedForSelection === 'Intern') && (
                     <div className="mt-2 space-y-1 animate-in fade-in">
                        <Label htmlFor="otherUserName" className="text-xs">{submittedForSelection} Name</Label>
                        <Input id="otherUserName" {...register('otherUserName')} placeholder={`Enter ${submittedForSelection}'s name`} />
                        {errors.otherUserName && <p className="text-sm text-destructive">{`${errors.otherUserName.message}`}</p>}
                    </div>
                )}
            </div>
          )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <div className="space-y-2">
          <Label htmlFor="amount">Amount (UGX)</Label>
          <Input id="amount" type="number" {...register('amount')} placeholder="e.g., 750000" />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register('date')} />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {expenseItemCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        />
        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Save Changes' : 'Log Expense'}
        </Button>
      </DialogFooter>
    </form>
  );
}


export default function FinancePage() {
  const [isNewIncomeDialogOpen, setIsNewIncomeDialogOpen] = useState(false);
  const [isNewExpenseDialogOpen, setIsNewExpenseDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Income | Expense | null>(null);
  const [transactionTypeToEdit, setTransactionTypeToEdit] = useState<'income' | 'expense' | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  useEffect(() => {
    // Safe to set client-side state after mount
    setSelectedMonth(new Date());
  }, []);

  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();
  const firestore = useFirestore();

  const financeRoles = ['Executive Director', 'Media & Finance Lead', 'Administrator', 'Media & Communications Lead'];
  const canManageFinances = profile && financeRoles.includes(profile.role);

  const incomeQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc')) : null, [firestore]);
  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('date', 'desc')) : null, [firestore]);

  const { data: allIncome, isLoading: isLoadingIncome } = useCollection<Income>(incomeQuery);
  const { data: allExpenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

  const monthlyData = useMemo(() => {
    if (!selectedMonth) return null;
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    const incomeBefore = allIncome?.filter(i => new Date(i.dateReceived) < monthStart).reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0;
    const expensesBefore = allExpenses?.filter(e => (e.status === 'Disbursed' || e.status === 'Acknowledged') && new Date(e.date) < monthStart).reduce((sum, e) => sum + Number(e.totalAmount || 0), 0) || 0;
    const balanceBroughtForward = incomeBefore - expensesBefore;
    
    const monthlyIncome = allIncome?.filter(i => new Date(i.dateReceived) >= monthStart && new Date(i.dateReceived) <= monthEnd) || [];
    const monthlyExpenses = allExpenses?.filter(e => new Date(e.date) >= monthStart && new Date(e.date) <= monthEnd) || [];
    const monthlyAcknowledgedExpenses = monthlyExpenses.filter(e => e.status === 'Disbursed' || e.status === 'Acknowledged');

    const totalMonthlyIncome = monthlyIncome.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const totalMonthlyExpenses = monthlyAcknowledgedExpenses.reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);

    const closingBalance = balanceBroughtForward + totalMonthlyIncome - totalMonthlyExpenses;

    const combinedTransactions = [
        ...monthlyIncome.map(i => ({ ...i, transactionType: 'income' as const, date: i.dateReceived, description: `Income: ${i.source}`, amount: Number(i.amount || 0) })),
        ...monthlyExpenses.map(e => ({ ...e, transactionType: 'expense' as const, date: e.date, description: e.title, amount: Number(e.totalAmount || 0) })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      balanceBroughtForward,
      totalMonthlyIncome,
      totalMonthlyExpenses,
      closingBalance,
      transactions: combinedTransactions
    };

  }, [selectedMonth, allIncome, allExpenses]);
  
  const chartData = useMemo(() => {
    if (!allExpenses) return [];
    
    const relevantExpenses = allExpenses.filter(e => e.status === 'Disbursed' || e.status === 'Acknowledged');
    
    const categoryTotals = relevantExpenses.reduce((acc, expense) => {
        if (expense.items && Array.isArray(expense.items)) {
            expense.items.forEach(item => {
                if (!acc[item.category]) {
                    acc[item.category] = 0;
                }
                acc[item.category] += Number(item.amount || 0);
            });
        }
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([name, total]) => ({
      name,
      total,
    }));
  }, [allExpenses]);
  
  const chartConfig = {
    total: {
      label: "Total",
      color: "hsl(var(--primary))",
    },
  };

  const isLoading = isLoadingIncome || isLoadingExpenses || !selectedMonth || !monthlyData;

  const handlePrevMonth = () => setSelectedMonth(prev => prev ? subMonths(prev, 1) : new Date());
  const handleNextMonth = () => setSelectedMonth(prev => prev ? addMonths(prev, 1) : new Date());
  
  const handleEdit = (transaction: Income | Expense, type: 'income' | 'expense') => {
      setEditingTransaction(transaction);
      setTransactionTypeToEdit(type);
  }

  const handleDelete = (transaction: Income | Expense, type: 'income' | 'expense') => {
    if (!firestore) return;
    const docRef = doc(firestore, type === 'income' ? 'income' : 'expenses', transaction.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: 'Transaction Deleted', description: 'The entry has been removed from the ledger.'});
  };

  const closeEditDialog = () => {
    setEditingTransaction(null);
    setTransactionTypeToEdit(null);
  }

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        icon={DollarSign}
        title="Financial Ledger"
        description="Real-time tracking of organizational income, operational expenses, and cashflow health."
        breadcrumbs={[{ name: 'Dashboard', href: '/' }, { name: 'Management', href: '/management' }, { name: 'Finance', href: '/management/finance' }]}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Ledger Area */}
        <div className="flex-1 space-y-6">
            {/* Financial Bento Stats */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    icon={Wallet}
                    label="Opening Balance"
                    value={isLoading ? '—' : formatCurrency(monthlyData.balanceBroughtForward)}
                    trend="Initial position"
                    color="text-slate-600"
                />
                <StatCard
                    icon={ArrowUpRight}
                    label="Monthly Income"
                    value={isLoading ? '—' : formatCurrency(monthlyData.totalMonthlyIncome)}
                    trend="Inflow this month"
                    color="text-emerald-600"
                    alertLevel="green"
                />
                <StatCard
                    icon={ArrowDownRight}
                    label="Monthly Expenses"
                    value={isLoading ? '—' : formatCurrency(monthlyData.totalMonthlyExpenses)}
                    trend="Operational burn"
                    color="text-rose-600"
                    alertLevel="yellow"
                />
                <StatCard
                    icon={CreditCard}
                    label="Closing Balance"
                    value={isLoading ? '—' : formatCurrency(monthlyData.closingBalance)}
                    trend="Current liquidity"
                    color="text-primary"
                />
            </div>

            <Card className="border-lg border-omuto-navy/10 shadow-comic-sm overflow-hidden bg-card/50 backdrop-blur-sm rounded-[2rem]">
                <CardHeader className="bg-omuto-cream/20 border-b-lg border-omuto-navy/5 p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-omuto-navy text-white rounded-2xl shadow-sm">
                                <History className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black tracking-tighter uppercase text-omuto-navy">Cashbook Log</CardTitle>
                                <CardDescription className="font-bold text-omuto-navy/40 uppercase text-[10px] tracking-widest mt-1">
                                    {isLoading ? 'Syncing...' : `Showing ${monthlyData.transactions.length} entries for ${format(selectedMonth!, 'MMMM yyyy')}`}
                                </CardDescription>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-card/80 p-2 rounded-[1.5rem] border-2 border-omuto-navy/5 shadow-sm">
                            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-10 w-10 hover:bg-omuto-navy/5 rounded-xl"><ChevronLeft className="h-4 w-4" /></Button>
                            <Input 
                                type="month" 
                                className="border-none bg-transparent font-black uppercase text-xs w-[140px] focus-visible:ring-0" 
                                value={selectedMonth ? format(selectedMonth, 'yyyy-MM') : ''} 
                                onChange={e => setSelectedMonth(new Date(e.target.value))} 
                            />
                            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-10 w-10 hover:bg-omuto-navy/5 rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="hidden sm:block">
                        <div className="mx-6 my-6 rounded-2xl border border-omuto-navy/5 overflow-hidden shadow-sm">
                            <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-b border-omuto-navy/5">
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/30 px-6 py-4">Date</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/30 px-6 py-4">Description</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-omuto-navy/30 px-6 py-4">Transaction Type</TableHead>
                                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-omuto-navy/30 px-6 py-4">Amount</TableHead>
                                {canManageFinances && <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-omuto-navy/30 px-6 py-4">Manage</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-b border-omuto-navy/5 last:border-0">
                                    <TableCell className="px-6 py-5"><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell className="px-6 py-5"><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell className="px-6 py-5"><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell className="text-right px-6 py-5"><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                                    {canManageFinances && <TableCell className="text-right px-6 py-5"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>}
                                </TableRow>
                                ))}
                                {!isLoading && monthlyData.transactions.map((t, index) => (
                                <TableRow key={`${t.id}-${index}`} className="border-b border-omuto-navy/5 last:border-0 group hover:bg-card transition-colors">
                                    <TableCell className="px-6 py-5 text-xs font-bold text-omuto-navy/60">{formatDateSafe(t.date, 'dateOnly')}</TableCell>
                                    <TableCell className="px-6 py-5">
                                        <span className="font-heading text-base font-black text-omuto-navy group-hover:text-primary transition-colors">{t.description}</span>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                    {t.transactionType === 'income' ? (
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-wider px-2 py-1">
                                            <ArrowUpCircle className="mr-1.5 h-3 w-3" /> Income
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-none font-black text-[9px] uppercase tracking-wider px-2 py-1">
                                            <ArrowDownCircle className="mr-1.5 h-3 w-3" /> Expense
                                        </Badge>
                                    )}
                                    </TableCell>
                                    <TableCell className={`px-6 py-5 text-right font-black text-base ${t.transactionType === 'income' ? 'text-emerald-600' : ((t as Expense).status === 'Disbursed' || (t as Expense).status === 'Acknowledged') ? 'text-rose-600' : 'text-muted-foreground'}`}>
                                    {t.transactionType === 'expense' && ((t as Expense).status !== 'Disbursed' && (t as Expense).status !== 'Acknowledged') ? `(${formatCurrency(t.amount)}) (Pending)` : formatCurrency(t.amount)}
                                    </TableCell>
                                    {canManageFinances && (
                                        <TableCell className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-omuto-navy/5 rounded-xl transition-all" onClick={() => handleEdit(t, t.transactionType)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="rounded-[2rem] border-lg border-omuto-navy/10 p-8 shadow-2xl">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="font-heading text-2xl font-black uppercase text-omuto-navy">Confirm Deletion</AlertDialogTitle>
                                                            <AlertDialogDescription className="font-bold text-sm text-omuto-navy/60">
                                                                This will permanently remove this entry from the ledger. This action cannot be reversed.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="mt-6">
                                                            <AlertDialogCancel className="rounded-xl font-black text-[10px] uppercase tracking-widest border-2">Cancel Tracking</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(t, t.transactionType)} className="rounded-xl bg-destructive font-black text-[10px] uppercase tracking-widest hover:bg-destructive/90">Yes, Remove</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                        </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                                ))}
                                {!isLoading && monthlyData.transactions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={canManageFinances ? 5 : 4} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="p-4 bg-muted/30 rounded-full">
                                                    <PlusCircle className="h-8 w-8 text-omuto-navy/20" />
                                                </div>
                                                <p className="font-black text-omuto-navy/20 uppercase text-xs tracking-widest">No entries for this period</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            </Table>
                        </div>
                    </div>
                    <div className="sm:hidden space-y-4 p-6">
                        {monthlyData && monthlyData.transactions.map((t, index) => (
                            <Card key={`mobile-${t.id}-${index}`} className="rounded-2xl border-2 border-omuto-navy/5 shadow-sm overflow-hidden">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-base font-black text-omuto-navy">{t.description}</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest">{formatDateSafe(t.date, 'dateOnly')}</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="flex justify-between items-center">
                                        {t.transactionType === 'income' ? (
                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-wider">Income</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-none font-black text-[9px] uppercase tracking-wider">Expense</Badge>
                                        )}
                                        <span className={`font-black text-lg ${t.transactionType === 'income' ? 'text-emerald-600' : ((t as Expense).status === 'Disbursed' || (t as Expense).status === 'Acknowledged') ? 'text-rose-600' : 'text-muted-foreground'}`}>
                                            {t.transactionType === 'expense' && ((t as Expense).status !== 'Disbursed' && (t as Expense).status !== 'Acknowledged') ? `(${formatCurrency(t.amount)}) (Pending)` : formatCurrency(t.amount)}
                                        </span>
                                    </div>
                                </CardContent>
                                {canManageFinances && (
                                    <CardFooter className="p-2 bg-muted/20 flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" className="h-8 text-xs font-black uppercase tracking-wider rounded-lg" onClick={() => handleEdit(t, t.transactionType)}>
                                            Edit
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 text-xs font-black uppercase tracking-wider text-rose-500 rounded-lg" onClick={() => handleDelete(t, t.transactionType)}>
                                            Delete
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Action Sidebar */}
        <div className="lg:w-80 space-y-6">
            <Card className="border-lg border-primary/20 bg-primary shadow-2xl shadow-primary/20 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-white font-heading text-2xl font-black uppercase tracking-tighter">Quick Actions</CardTitle>
                    <CardDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest mt-1">Transaction Center</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                    <Dialog open={isNewIncomeDialogOpen} onOpenChange={setIsNewIncomeDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full h-16 bg-card text-primary hover:bg-card/90 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl group">
                                <ArrowUpCircle className="mr-3 h-5 w-5 group-hover:-translate-y-1 transition-transform" />
                                Log Income
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg rounded-[2rem] p-8 border-lg shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="font-heading text-2xl font-black uppercase tracking-tighter text-omuto-navy">Log New Income</DialogTitle>
                                <DialogDescription className="font-bold text-omuto-navy/40 uppercase text-[10px] tracking-widest">Financial Inflow</DialogDescription>
                            </DialogHeader>
                            <IncomeForm onFormSubmit={() => setIsNewIncomeDialogOpen(false)} />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isNewExpenseDialogOpen} onOpenChange={setIsNewExpenseDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full h-16 bg-omuto-navy text-white hover:bg-omuto-navy/90 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl group border-2 border-white/5">
                                <ArrowDownCircle className="mr-3 h-5 w-5 group-hover:translate-y-1 transition-transform" />
                                Log Expense
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg rounded-[2rem] p-8 border-lg shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="font-heading text-2xl font-black uppercase tracking-tighter text-omuto-navy">Log Operational Expense</DialogTitle>
                                <DialogDescription className="font-bold text-omuto-navy/40 uppercase text-[10px] tracking-widest">Financial Outflow</DialogDescription>
                            </DialogHeader>
                            <ExpenseForm onFormSubmit={() => setIsNewExpenseDialogOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </CardContent>
                <CardFooter className="bg-card/5 p-6 border-t border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 text-center w-full">Double-entry verified</p>
                </CardFooter>
            </Card>

            <Card className="border-lg border-omuto-navy/5 bg-card shadow-sm rounded-[2rem] overflow-hidden">
                <CardHeader className="p-6">
                    <CardTitle className="font-heading text-xl font-black uppercase text-omuto-navy">Spend Matrix</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-omuto-navy/30">Category Allocation</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    {isLoading ? <Skeleton className="h-48 w-full rounded-2xl" /> : (
                        <div className="space-y-4">
                             {chartData.slice(0, 5).map((item, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-omuto-navy">{item.name}</span>
                                        <span className="text-[10px] font-bold text-omuto-navy/40">{formatCurrency(item.total)}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary" 
                                            style={{ width: `${(item.total / (monthlyData?.totalMonthlyExpenses || 1)) * 100}%` }} 
                                        />
                                    </div>
                                </div>
                             ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>

     <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="sm:max-w-lg rounded-[2rem] p-8 border-lg shadow-2xl">
            <DialogHeader>
                <DialogTitle className="font-heading text-2xl font-black uppercase tracking-tighter text-omuto-navy">Edit Transaction</DialogTitle>
                <DialogDescription className="font-bold text-omuto-navy/40 uppercase text-[10px] tracking-widest">Modifier Mode</DialogDescription>
            </DialogHeader>
            {transactionTypeToEdit === 'income' && (
                <IncomeForm income={editingTransaction as Income} onFormSubmit={closeEditDialog} />
            )}
            {transactionTypeToEdit === 'expense' && (
                 <ExpenseForm expense={editingTransaction as Expense} onFormSubmit={closeEditDialog} />
            )}
        </DialogContent>
    </Dialog>
    </div>
  );
}
