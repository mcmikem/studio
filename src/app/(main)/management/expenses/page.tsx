
'use client';

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
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, where } from 'firebase/firestore';
import type { Expense } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Receipt } from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatDateSafe } from '@/lib/utils';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { createAlert } from '@/ai/flows/create-alert-flow';


const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(value);
};

const statusColors: { [key: string]: string } = {
  Pending: 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
  Approved: 'border-green-500 bg-green-500/10 text-green-500',
  Rejected: 'border-red-500 bg-red-500/10 text-red-500',
  Cleared: 'border-blue-500 bg-blue-500/10 text-blue-500',
};

const typeColors: { [key: string]: string } = {
    Requisition: 'border-blue-500 bg-blue-500/10 text-blue-500',
    Reimbursement: 'border-purple-500 bg-purple-500/10 text-purple-500',
};


export default function ExpensesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // We only show actionable items here. Cleared and Rejected are considered "archived".
    return query(
        collection(firestore, 'expenses'), 
        where('status', 'in', ['Pending', 'Approved']),
        orderBy('createdAt', 'desc')
    );
  }, [firestore]);
  
  const allExpensesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery);
  const { data: allExpenses, isLoading: isLoadingAll } = useCollection<Expense>(allExpensesQuery);
  
  const chartData = useMemo(() => {
    if (!allExpenses) return [];
    
    const categoryTotals = allExpenses.reduce((acc, expense) => {
      if (expense.status === 'Approved' || expense.status === 'Cleared') {
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


  const handleStatusUpdate = async (expense: Expense, status: 'Approved' | 'Rejected') => {
    if (!firestore) return;
    const expenseRef = doc(firestore, 'expenses', expense.id);
    try {
        await updateDocumentNonBlocking(expenseRef, { status: status });
        toast({
          title: `Expense ${status}`,
          description: `The expense report has been marked as ${status.toLowerCase()}.`,
        });

        // Create a notification for the user
        await createAlert({
            type: status === 'Approved' ? 'Info' : 'Urgent',
            message: `Your expense for '${expense.title}' was ${status.toLowerCase()}.`,
            priority: status === 'Approved' ? 'Low' : 'Medium',
            action: `/activity-log`, // Future: Link to user's personal expense history
        });

    } catch (error) {
         toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update the expense status. Please try again.",
        });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="h-8 w-8" />
          Expense Management
        </h1>
        <p className="text-muted-foreground">
          Review, approve, or reject expense reports submitted by the team.
        </p>
      </header>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                  <CardTitle>Actionable Expense Reports</CardTitle>
                  <CardDescription>This view shows all 'Pending' and 'Approved' reports that require action.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mobile View */}
                    <div className="space-y-4 sm:hidden">
                        {(isLoading || isLoadingAll) && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                        {expenses && expenses.length > 0 ? (
                            expenses.map((expense) => (
                                <Card key={expense.id}>
                                    <CardHeader>
                                        <CardTitle className="text-base">{expense.title}</CardTitle>
                                        <CardDescription>{expense.userName} - {formatDateSafe(expense.date, 'dateOnly')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-lg">{formatCurrency(expense.totalAmount)}</p>
                                        </div>
                                        <div className='flex flex-col items-end gap-1'>
                                            <Badge variant="outline" className={statusColors[expense.status]}>{expense.status}</Badge>
                                            <Badge variant="outline" className={typeColors[expense.type]}>{expense.type}</Badge>
                                        </div>
                                    </CardContent>
                                    {expense.status === 'Pending' && (
                                        <CardFooter className="flex justify-end gap-2">
                                            <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-primary border-primary hover:bg-primary/10 hover:text-primary"
                                            onClick={() => handleStatusUpdate(expense, 'Approved')}
                                            >
                                            <Check className="mr-2 h-4 w-4" /> Approve
                                            </Button>
                                            <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => handleStatusUpdate(expense, 'Rejected')}
                                            >
                                            <X className="mr-2 h-4 w-4" /> Reject
                                            </Button>
                                        </CardFooter>
                                    )}
                                </Card>
                            ))
                        ) : (
                            !(isLoading || isLoadingAll) && (
                                <div className="h-48 text-center text-muted-foreground flex flex-col items-center justify-center">
                                    <Receipt className="h-12 w-12" />
                                    <span className="text-lg font-semibold mt-2">No Actionable Expenses</span>
                                    <p className="text-sm">All pending reports have been processed.</p>
                                </div>
                            )
                        )}
                    </div>
                    {/* Desktop View */}
                    <div className="hidden sm:block">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(isLoading || isLoadingAll) &&
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                            {expenses && expenses.length > 0 ? (
                            expenses.map((expense) => (
                                <TableRow key={expense.id}>
                                <TableCell className="font-medium">{expense.userName}</TableCell>
                                <TableCell>{formatDateSafe(expense.date, 'dateOnly')}</TableCell>
                                <TableCell>{expense.title}</TableCell>
                                <TableCell>{formatCurrency(expense.totalAmount)}</TableCell>
                                 <TableCell>
                                    <Badge variant="outline" className={typeColors[expense.type]}>
                                        {expense.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={statusColors[expense.status]}>
                                        {expense.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {expense.status === 'Pending' && (
                                    <div className="flex justify-end gap-2">
                                        <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-primary hover:text-primary"
                                        onClick={() => handleStatusUpdate(expense, 'Approved')}
                                        >
                                        <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleStatusUpdate(expense, 'Rejected')}
                                        >
                                        <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    )}
                                </TableCell>
                                </TableRow>
                            ))
                            ) : (
                            !(isLoading || isLoadingAll) && (
                                <TableRow>
                                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                    <Receipt className="h-12 w-12" />
                                    <span className="text-lg font-semibold">
                                        No Actionable Expenses
                                    </span>
                                    <p className="text-sm">
                                        All pending reports have been processed.
                                    </p>
                                    </div>
                                </TableCell>
                                </TableRow>
                            )
                            )}
                        </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle>Total Spending by Category</CardTitle>
                    <CardDescription>Based on all 'Approved' and 'Cleared' expenses.</CardDescription>
                </CardHeader>
                <CardContent>
                     {(isLoading || isLoadingAll) && <Skeleton className="w-full h-64" />}
                     {!(isLoading || isLoadingAll) && chartData.length > 0 && (
                        <ChartContainer config={chartConfig} className="w-full h-64">
                            <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
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
                    {!(isLoading || isLoadingAll) && chartData.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                            <Receipt className="h-12 w-12" />
                            <p className="mt-4 font-semibold">No spending data to show.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
    </div>
  );
}

    