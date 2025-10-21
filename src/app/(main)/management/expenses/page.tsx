

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
import { useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, where } from 'firebase/firestore';
import type { Expense } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Receipt, CheckCheck } from 'lucide-react';
import { useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatDateSafe, cn, formatCurrency } from '@/lib/utils';
import { createAlert } from '@/ai/dev';


const statusColors: { [key: string]: string } = {
  Pending: 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
  Approved: 'border-blue-500 bg-blue-500/10 text-blue-500',
  Disbursed: 'border-purple-500 bg-purple-500/10 text-purple-500',
  Acknowledged: 'border-green-500 bg-green-500/10 text-green-500',
  Rejected: 'border-red-500 bg-red-500/10 text-red-500',
};

const typeColors: { [key: string]: string } = {
    Requisition: 'border-blue-500 bg-blue-500/10 text-blue-500',
    Reimbursement: 'border-purple-500 bg-purple-500/10 text-purple-500',
};

function ExpensesContent() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const highlightedExpenseId = searchParams.get('highlight');

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'expenses'), 
        orderBy('createdAt', 'desc')
    );
  }, [firestore]);
  
  const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery);
  
  const chartData = useMemo(() => {
    if (!expenses) return [];
    
    const relevantExpenses = expenses.filter(e => e.status === 'Disbursed' || e.status === 'Acknowledged');
    
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
  }, [expenses]);
  
  const chartConfig = {
    total: {
      label: "Total",
      color: "hsl(var(--primary))",
    },
  };

  useEffect(() => {
    if (highlightedExpenseId) {
      const element = document.getElementById(`expense-${highlightedExpenseId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedExpenseId, expenses]);


  const handleStatusUpdate = async (expense: Expense, status: Expense['status']) => {
    if (!firestore || !currentUser) return;
    const expenseRef = doc(firestore, 'expenses', expense.id);
    try {
        updateDocumentNonBlocking(expenseRef, { status: status });
        toast({
          title: `Expense ${status}`,
          description: `The expense report has been marked as ${status.toLowerCase()}.`,
        });

        // Notify user of approval or rejection
        if (expense.userId !== currentUser.uid && (status === 'Approved' || status === 'Rejected' || status === 'Disbursed')) {
            let message = '';
            if (status === 'Approved') {
                message = `Your expense report for "${expense.title}" has been approved and is awaiting disbursement.`;
            } else if (status === 'Rejected') {
                message = `Your expense report for "${expense.title}" has been rejected.`;
            } else if (status === 'Disbursed') {
                message = `Funds for "${expense.title}" have been disbursed. Please go to "My Finances" to acknowledge receipt.`;
            }

            await createAlert({
                type: status === 'Rejected' ? 'Urgent' : 'Info',
                message: message,
                priority: status === 'Rejected' ? 'High' : 'Medium',
                action: `/my-finances`, 
                creatorId: currentUser.uid,
            });
        }

    } catch (error) {
         toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update the expense status. Please try again.",
        });
    }
  };
  
  const highlightClass = "ring-2 ring-primary bg-primary/5";

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="h-8 w-8" />
          Expense Management
        </h1>
        <p className="text-muted-foreground">
          Review, approve, disburse, and track all team expense reports.
        </p>
      </header>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                  <CardTitle>Expense Report History</CardTitle>
                  <CardDescription>This view shows all reports, including 'Pending', 'Approved', 'Disbursed', and 'Acknowledged'.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading &&
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                        {expenses && expenses.length > 0 ? (
                        expenses.map((expense) => (
                            <TableRow key={expense.id} id={`expense-${expense.id}`} className={cn(expense.id === highlightedExpenseId && highlightClass, "transition-all")}>
                            <TableCell className="font-medium">{expense.userName}</TableCell>
                            <TableCell>{formatDateSafe(expense.date, 'dateOnly')}</TableCell>
                            <TableCell>{expense.title}</TableCell>
                            <TableCell>{formatCurrency(expense.totalAmount)}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={statusColors[expense.status]}>
                                    {expense.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {expense.status === 'Pending' && expense.userId !== currentUser?.uid && (
                                  <div className="flex justify-end gap-2">
                                      <Button variant="ghost" size="icon" className="text-primary hover:text-primary" onClick={() => handleStatusUpdate(expense, 'Approved')}><Check className="h-4 w-4" /></Button>
                                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleStatusUpdate(expense, 'Rejected')}><X className="h-4 w-4" /></Button>
                                  </div>
                                )}
                                {expense.status === 'Approved' && currentUser?.role !== 'Field Coordinator' && (
                                     <Button size="sm" onClick={() => handleStatusUpdate(expense, 'Disbursed')}>Mark Disbursed</Button>
                                )}
                                {expense.status === 'Disbursed' && expense.userId === currentUser?.uid && (
                                     <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(expense, 'Acknowledged')}><CheckCheck className="mr-2 h-4 w-4"/>Acknowledge Receipt</Button>
                                )}
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        !isLoading && (
                            <TableRow>
                            <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center gap-2">
                                <Receipt className="h-12 w-12" />
                                <span className="text-lg font-semibold">No Expenses Found</span>
                                <p className="text-sm">No reports have been submitted yet.</p>
                                </div>
                            </TableCell>
                            </TableRow>
                        )
                        )}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle>Spending by Category</CardTitle>
                    <CardDescription>Based on all 'Disbursed' and 'Acknowledged' expenses.</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading && <Skeleton className="w-full h-64" />}
                     {!isLoading && chartData.length > 0 && (
                        <ChartContainer config={chartConfig} className="w-full h-64">
                            <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground))' }} width={80} />
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

export default function ExpensesPage() {
    return (
        <Suspense>
            <ExpensesContent />
        </Suspense>
    )
}
