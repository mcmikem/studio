
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, where } from 'firebase/firestore';
import type { Expense, User, ExpenseItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Receipt, CheckCheck, Undo2, Edit, Trash2, Eye } from 'lucide-react';
import { useMemo, useEffect, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatDateSafe, cn, formatCurrency } from '@/lib/utils';
import { createAlert } from '@/ai/flows/create-alert-flow';
import { useUserProfile } from '@/hooks/use-user-profile';
import { ExpenseReportForm } from '@/components/forms/expense-report-form';


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


function ExpenseDetailsDialog({ expense, isOpen, onOpenChange }: { expense: Expense, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{expense.title}</DialogTitle>
                    <DialogDescription>
                        Expense report from {expense.userName} on {formatDateSafe(expense.date, 'dateOnly')}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expense.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                                </TableRow>
                            ))}
                             <TableRow className="font-bold bg-muted/50">
                                <TableCell colSpan={2}>Total Amount</TableCell>
                                <TableCell className="text-right">{formatCurrency(expense.totalAmount)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    )
}


function ExpensesContent() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { profile } = useUserProfile(currentUser);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const highlightedExpenseId = searchParams.get('highlight');
  
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'expenses'), 
        orderBy('createdAt', 'desc')
    );
  }, [firestore]);
  
  const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery);
  
  // Query for users who can manage finances to target notifications
  const financeUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', 'in', ['Executive Director', 'Media & Finance Lead', 'Media & Communications Lead']));
  }, [firestore]);
  const { data: financeUsers } = useCollection<User>(financeUsersQuery);

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

  const approvalRoles = [
      'Executive Director',
      'Programs & Partnerships Manager',
      'Operations & Field Manager'
  ];
  
  const financeRoles = ['Executive Director', 'Media & Finance Lead', 'Administrator', 'Media & Communications Lead'];

  const canApprove = profile && approvalRoles.includes(profile.role);
  const canManageFinances = profile && financeRoles.includes(profile.role);


  const handleStatusUpdate = async (expense: Expense, status: Expense['status']) => {
    if (!firestore || !currentUser) return;
    const expenseRef = doc(firestore, 'expenses', expense.id);
    try {
        await updateDocumentNonBlocking(expenseRef, { status: status });
        toast({
          title: `Expense ${status}`,
          description: `The expense report has been marked as ${status.toLowerCase()}.`,
        });

        let messageToUser = '';
        let targetUserIds: string[] | undefined;
        let priority: 'High' | 'Medium' | 'Low' = 'Medium';
        let action = '/my-finances';

        if (expense.userId !== currentUser.uid) {
            targetUserIds = [expense.userId];
            if (status === 'Approved') {
                messageToUser = `Your expense report for "${expense.title}" has been approved and is awaiting disbursement.`;
            } else if (status === 'Rejected') {
                messageToUser = `Your expense report for "${expense.title}" has been rejected.`;
                priority = 'High';
            } else if (status === 'Disbursed') {
                messageToUser = `Funds for "${expense.title}" have been disbursed. Please go to "My Finances" to acknowledge receipt.`;
                priority = 'High';
            }

            if (messageToUser) {
              await createAlert({
                  type: status === 'Rejected' ? 'Urgent' : 'Info',
                  message: messageToUser,
                  priority: priority,
                  action: action, 
                  creatorId: currentUser.uid,
                  targetUserIds: targetUserIds,
              });
            }
        }

        if (status === 'Approved' && financeUsers) {
            const financeTeamIds = financeUsers.map(u => u.id).filter(id => id !== currentUser.uid);
            if (financeTeamIds.length > 0) {
              await createAlert({
                  type: 'Reminder',
                  priority: 'High',
                  message: `An expense report for ${expense.userName} (${formatCurrency(expense.totalAmount)}) is approved and needs disbursement.`,
                  action: `/management/expenses?highlight=${expense.id}`,
                  creatorId: currentUser.uid,
                  targetUserIds: financeTeamIds,
              });
            }
        }


    } catch (error) {
         toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update the expense status. Please try again.",
        });
    }
  };

   const handleDelete = (expense: Expense) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'expenses', expense.id)).then(() => {
        toast({
            title: "Expense Deleted",
            description: `The expense report "${expense.title}" has been deleted.`,
        });
    }).catch(err => {
        console.error("Delete failed: ", err);
        toast({ variant: 'destructive', title: "Delete Failed" });
    })
  };
  
  const highlightClass = "ring-2 ring-primary bg-primary/5";

  return (
    <>
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
                    <div className="hidden sm:block">
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
                                    <div className="flex justify-end items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingExpense(expense)}><Eye className="h-4 w-4" /></Button>
                                        {canApprove && expense.status === 'Pending' && expense.userId !== currentUser?.uid && (
                                          <div className="flex gap-1">
                                              <Button variant="ghost" size="icon" className="text-primary hover:text-primary h-8 w-8" onClick={() => handleStatusUpdate(expense, 'Approved')}><Check className="h-4 w-4" /></Button>
                                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => handleStatusUpdate(expense, 'Rejected')}><X className="h-4 w-4" /></Button>
                                          </div>
                                        )}
                                        {canManageFinances && (expense.status === 'Approved' || expense.status === 'Rejected') && (
                                          <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(expense, 'Pending')}>
                                            <Undo2 className="mr-2 h-4 w-4" /> Reverse
                                          </Button>
                                        )}
                                        {canManageFinances && expense.status === 'Approved' && (
                                             <Button size="sm" onClick={() => handleStatusUpdate(expense, 'Disbursed')}>Mark Disbursed</Button>
                                        )}
                                        {expense.status === 'Disbursed' && expense.userId === currentUser?.uid && (
                                             <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(expense, 'Acknowledged')}><CheckCheck className="mr-2 h-4 w-4"/>Acknowledge Receipt</Button>
                                        )}
                                        {canManageFinances && (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingExpense(expense)}><Edit className="h-4 w-4" /></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This action cannot be undone. This will permanently delete the expense report "{expense.title}".</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(expense)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </>
                                        )}
                                    </div>
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
                    </div>
                    <div className="sm:hidden space-y-4">
                        {expenses?.map(expense => (
                            <Card key={`mobile-${expense.id}`} id={`mobile-expense-${expense.id}`} className={cn(expense.id === highlightedExpenseId && highlightClass, "transition-all")}>
                                <CardHeader>
                                    <CardTitle>{expense.title}</CardTitle>
                                    <CardDescription>{expense.userName} - {formatDateSafe(expense.date, 'dateOnly')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="flex justify-between items-center">
                                        <span className="text-2xl font-bold">{formatCurrency(expense.totalAmount)}</span>
                                        <Badge variant="outline" className={statusColors[expense.status]}>{expense.status}</Badge>
                                    </div>
                                     <div className="flex justify-end items-center gap-1 flex-wrap">
                                        <Button variant="outline" size="sm" onClick={() => setViewingExpense(expense)}><Eye className="mr-2 h-4 w-4"/>View Details</Button>
                                        {canApprove && expense.status === 'Pending' && expense.userId !== currentUser?.uid && (
                                          <div className="flex gap-1">
                                              <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleStatusUpdate(expense, 'Approved')}><Check className="h-4 w-4 mr-1" />Approve</Button>
                                              <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(expense, 'Rejected')}><X className="h-4 w-4 mr-1" />Reject</Button>
                                          </div>
                                        )}
                                        {canManageFinances && (expense.status === 'Approved' || expense.status === 'Rejected') && (
                                          <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(expense, 'Pending')}>
                                            <Undo2 className="mr-2 h-4 w-4" /> Reverse
                                          </Button>
                                        )}
                                        {canManageFinances && expense.status === 'Approved' && (
                                             <Button size="sm" onClick={() => handleStatusUpdate(expense, 'Disbursed')}>Mark Disbursed</Button>
                                        )}
                                        {expense.status === 'Disbursed' && expense.userId === currentUser?.uid && (
                                             <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(expense, 'Acknowledged')}><CheckCheck className="mr-2 h-4 w-4"/>Acknowledge</Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
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
    <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Edit Expense Report</DialogTitle>
                <DialogDescription>
                    Update the details for "{editingExpense?.title}".
                </DialogDescription>
            </DialogHeader>
            {editingExpense && <ExpenseReportForm
                expense={editingExpense}
                onSuccess={() => setEditingExpense(null)}
            />}
        </DialogContent>
    </Dialog>

    {viewingExpense && (
        <ExpenseDetailsDialog 
            expense={viewingExpense} 
            isOpen={!!viewingExpense}
            onOpenChange={() => setViewingExpense(null)}
        />
    )}
    </>
  );
}

export default function ExpensesPage() {
    return (
        <Suspense>
            <ExpensesContent />
        </Suspense>
    )
}

    
