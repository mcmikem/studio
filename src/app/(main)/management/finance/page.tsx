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
import type { Income, Expense, User } from '@/lib/types';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { DollarSign, PlusCircle, ArrowUpCircle, ArrowDownCircle, Loader2, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateSafe, formatCurrency } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useUserProfile } from '@/hooks/use-user-profile';

const incomeSchema = z.object({
  source: z.string().min(3, 'Source is required.'),
  amount: z.coerce.number().min(1, 'Amount must be greater than zero.'),
  dateReceived: z.string().min(1, 'Date is required.'),
  type: z.enum(['Member Donations', 'Fundraising', 'In-kind Contributions', 'Grants', 'Partnerships', 'Omuto Essentials', 'Imac Enterprises', 'Other']),
  notes: z.string().optional(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

const expenseItemCategories = ["Transport", "Rent", "Office Dev't", "Projects", "Stationery", "Registration", "Meetings", "Media", "Fuel", "Printing & Photocopy", "Phone", "Food", "Mobile Money Charges", "IGA Expense", "Allowances and stipends", "Kibanja", "Professional Services", "community support", "miscellaneous", "Withdraw"] as const;

const directExpenseSchema = z.object({
  title: z.string().min(3, 'A title for the expense is required.'),
  amount: z.coerce.number().min(1, 'Amount must be greater than zero.'),
  date: z.string().min(1, 'Date is required.'),
  category: z.enum(expenseItemCategories),
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
    defaultValues: isEditMode ? {
        ...income,
        dateReceived: formatDateSafe(income.dateReceived, 'iso')
    } : {
      type: 'Grants',
      dateReceived: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = (data: IncomeFormData) => {
    if (!firestore) return;

    if (isEditMode && income) {
        const docRef = doc(firestore, 'income', income.id);
        updateDocumentNonBlocking(docRef, data);
        toast({ title: "Income Updated!", description: `${formatCurrency(data.amount)} from ${data.source} has been updated.`});
    } else {
        const newIncome = { ...data, createdAt: serverTimestamp() };
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
    defaultValues: isEditMode ? {
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

  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();
  const firestore = useFirestore();

  const financeRoles = ['Executive Director', 'Media & Finance Lead', 'Administrator'];
  const canManageFinances = profile && financeRoles.includes(profile.role);

  const incomeQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc')) : null, [firestore]);
  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('date', 'desc')) : null, [firestore]);

  const { data: allIncome, isLoading: isLoadingIncome } = useCollection<Income>(incomeQuery);
  const { data: allExpenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

  const monthlyData = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    const incomeBefore = allIncome?.filter(i => new Date(i.dateReceived) < monthStart).reduce((sum, i) => sum + i.amount, 0) || 0;
    const expensesBefore = allExpenses?.filter(e => (e.status === 'Disbursed' || e.status === 'Acknowledged') && new Date(e.date) < monthStart).reduce((sum, e) => sum + e.totalAmount, 0) || 0;
    const balanceBroughtForward = incomeBefore - expensesBefore;
    
    const monthlyIncome = allIncome?.filter(i => new Date(i.dateReceived) >= monthStart && new Date(i.dateReceived) <= monthEnd) || [];
    const monthlyExpenses = allExpenses?.filter(e => new Date(e.date) >= monthStart && new Date(e.date) <= monthEnd) || [];
    const monthlyAcknowledgedExpenses = monthlyExpenses.filter(e => e.status === 'Disbursed' || e.status === 'Acknowledged');

    const totalMonthlyIncome = monthlyIncome.reduce((sum, i) => sum + i.amount, 0);
    const totalMonthlyExpenses = monthlyAcknowledgedExpenses.reduce((sum, e) => sum + e.totalAmount, 0);

    const closingBalance = balanceBroughtForward + totalMonthlyIncome - totalMonthlyExpenses;

    const combinedTransactions = [
        ...monthlyIncome.map(i => ({ ...i, transactionType: 'income' as const, date: i.dateReceived, description: `Income: ${i.source}`, amount: i.amount })),
        ...monthlyExpenses.map(e => ({ ...e, transactionType: 'expense' as const, date: e.date, description: e.title, amount: e.totalAmount })),
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
                acc[item.category] += item.amount;
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

  const isLoading = isLoadingIncome || isLoadingExpenses;

  const handlePrevMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
  const handleNextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1));
  
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Financial Ledger (Cashbook)</CardTitle>
                  <CardDescription>A complete log of all income and expense transactions.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                    <Input type="month" className="w-auto" value={format(selectedMonth, 'yyyy-MM')} onChange={e => setSelectedMonth(new Date(e.target.value))} />
                    <Button variant="outline" size="icon" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Opening Balance</p>
                    <p className="text-xl font-bold">{formatCurrency(monthlyData.balanceBroughtForward)}</p>
                </Card>
                 <Card className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Monthly Income</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(monthlyData.totalMonthlyIncome)}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Monthly Expenses</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(monthlyData.totalMonthlyExpenses)}</p>
                </Card>
                <Card className="p-4 bg-muted">
                    <p className="text-sm font-medium text-muted-foreground">Closing Balance</p>
                    <p className="text-xl font-bold">{formatCurrency(monthlyData.closingBalance)}</p>
                </Card>
            </div>
             <div className="flex gap-2 justify-end">
                <Dialog open={isNewExpenseDialogOpen} onOpenChange={setIsNewExpenseDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive" className="h-full">
                        <ArrowDownCircle className="mr-2 h-4 w-4" />
                        Log Expense
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                    <DialogTitle>Log Direct Expense</DialogTitle>
                    <DialogDescription>
                        Record an expense that doesn't require a report (e.g., rent, utilities).
                    </DialogDescription>
                    </DialogHeader>
                    <ExpenseForm onFormSubmit={() => setIsNewExpenseDialogOpen(false)} />
                </DialogContent>
                </Dialog>
                <Dialog open={isNewIncomeDialogOpen} onOpenChange={setIsNewIncomeDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="h-full">
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    Log Income
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                    <DialogTitle>Log New Income</DialogTitle>
                    <DialogDescription>
                        Record a new grant, donation, or other revenue.
                    </DialogDescription>
                    </DialogHeader>
                    <IncomeForm onFormSubmit={() => setIsNewIncomeDialogOpen(false)} />
                </DialogContent>
                </Dialog>
            </div>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {canManageFinances && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                    {canManageFinances && <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>}
                </TableRow>
                ))}
                {monthlyData.transactions.map((t, index) => (
                <TableRow key={`${t.id}-${index}`}>
                    <TableCell>{formatDateSafe(t.date, 'dateOnly')}</TableCell>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell>
                    {t.transactionType === 'income' ? (
                        <span className="flex items-center text-green-600"><ArrowUpCircle className="mr-2 h-4 w-4" /> Income</span>
                    ) : (
                        <span className="flex items-center text-red-600"><ArrowDownCircle className="mr-2 h-4 w-4" /> Expense</span>
                    )}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${t.transactionType === 'income' ? 'text-green-600' : (t as Expense).status === 'Disbursed' || (t as Expense).status === 'Acknowledged' ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {t.transactionType === 'expense' && (t as Expense).status !== 'Disbursed' && (t as Expense).status !== 'Acknowledged' ? `(${(formatCurrency(t.amount))})` : formatCurrency(t.amount)}
                    </TableCell>
                    {canManageFinances && (
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(t, t.transactionType)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently delete this transaction. This action cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(t, t.transactionType)}>Delete</AlertDialogAction>
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
                        <TableCell colSpan={canManageFinances ? 5 : 4} className="h-48 text-center">No transactions recorded for {format(selectedMonth, 'MMMM yyyy')}.</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle>Spending by Category (All Time)</CardTitle>
            <CardDescription>Based on all 'Disbursed' and 'Acknowledged' expenses.</CardDescription>
        </CardHeader>
        <CardContent>
             {isLoading && <Skeleton className="w-full h-96" />}
             {!isLoading && chartData.length > 0 && (
                <ChartContainer config={chartConfig} className="w-full h-96">
                    <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 120 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground))' }} />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)}/>}
                        />
                        <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                    </BarChart>
                </ChartContainer>
            )}
            {!isLoading && chartData.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                    <DollarSign className="h-12 w-12" />
                    <p className="mt-4 font-semibold">No spending data to show.</p>
                </div>
            )}
        </CardContent>
    </Card>
     <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Edit Transaction</DialogTitle>
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
