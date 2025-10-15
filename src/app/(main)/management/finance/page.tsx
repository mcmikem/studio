
'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import type { Income, Expense } from '@/lib/types';
import { format } from 'date-fns';
import { DollarSign, PlusCircle, ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateSafe } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(value);
};

const incomeSchema = z.object({
  source: z.string().min(3, 'Source is required.'),
  amount: z.coerce.number().min(1, 'Amount must be greater than zero.'),
  dateReceived: z.string().min(1, 'Date is required.'),
  type: z.enum(['Member Donations', 'Fundraising', 'In-kind Contributions', 'Grants', 'Partnerships', 'Omuto Essentials', 'Imac Enterprises', 'Other']),
  notes: z.string().optional(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

function IncomeForm({ onFormSubmit }: { onFormSubmit: () => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      type: 'Grants',
      dateReceived: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = (data: IncomeFormData) => {
    if (!firestore) return;

    const newIncome = {
      ...data,
      createdAt: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(firestore, 'income'), newIncome);
    toast({
      title: 'Income Logged!',
      description: `${formatCurrency(data.amount)} from ${data.source} has been recorded.`,
    });
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
          Log Income
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function FinancePage() {
  const [isNewIncomeDialogOpen, setIsNewIncomeDialogOpen] = useState(false);
  const firestore = useFirestore();

  const incomeQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'income'), orderBy('dateReceived', 'desc')) : null, [firestore]);
  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('date', 'desc')) : null, [firestore]);

  const { data: income, isLoading: isLoadingIncome } = useCollection<Income>(incomeQuery);
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

  const transactions = useMemo(() => {
    const combined = [
      ...(income || []).map(i => ({ ...i, transactionType: 'income' as const, date: i.dateReceived, description: `Income from ${i.source}` })),
      ...(expenses || []).map(e => ({ ...e, transactionType: 'expense' as const, date: e.date, description: e.title, amount: e.totalAmount })),
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [income, expenses]);

  const cashBalance = useMemo(() => {
      const totalIncome = income?.reduce((sum, i) => sum + i.amount, 0) || 0;
      const totalDisbursedExpenses = expenses?.filter(e => e.status === 'Disbursed' || e.status === 'Acknowledged').reduce((sum, e) => sum + e.totalAmount, 0) || 0;
      return totalIncome - totalDisbursedExpenses;
  }, [income, expenses]);

  const isLoading = isLoadingIncome || isLoadingExpenses;

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardTitle>Financial Ledger</CardTitle>
          <CardDescription>A complete log of all income and expense transactions.</CardDescription>
        </div>
        <div className="flex gap-2">
            <Card className="p-3">
                <p className="text-sm font-medium text-muted-foreground">Cash Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(cashBalance)}</p>
            </Card>
            <Dialog open={isNewIncomeDialogOpen} onOpenChange={setIsNewIncomeDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
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
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
              </TableRow>
            ))}
            {transactions.map((t, index) => (
              <TableRow key={`${t.transactionType}-${t.id}-${index}`}>
                <TableCell>{formatDateSafe(t.date, 'dateOnly')}</TableCell>
                <TableCell className="font-medium">{t.description}</TableCell>
                <TableCell>
                  {t.transactionType === 'income' ? (
                     <span className="flex items-center text-green-600"><ArrowUpCircle className="mr-2 h-4 w-4" /> Income</span>
                  ) : (
                     <span className="flex items-center text-red-600"><ArrowDownCircle className="mr-2 h-4 w-4" /> Expense</span>
                  )}
                </TableCell>
                <TableCell className={`text-right font-bold ${t.transactionType === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(t.amount)}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && transactions.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center">No transactions recorded yet.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
