
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import type { Expense, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Receipt, CheckCheck, Undo2, Edit, Trash2, Eye, AlertTriangle, FileText, Banknote } from 'lucide-react';
import { useMemo, useEffect, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
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

function ExpenseDetailsDialog({ expense, isOpen, onOpenChange }: { expense: Expense, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{expense.title}</DialogTitle>
                    <DialogDescription>
                        {expense.type} report from {expense.userName} on {formatDateSafe(expense.date, 'dateOnly')}.
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

function ExpensesTable({ 
    expenses, 
    isLoading, 
    highlightedExpenseId, 
    currentUser, 
    canApprove, 
    canManageFinances, 
    handleStatusUpdate, 
    setViewingExpense, 
    setEditingExpense, 
    handleDelete 
}: any) {
    const highlightClass = "ring-2 ring-primary bg-primary/5";

    return (
        <div className="rounded-md border">
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
                    {isLoading && Array.from({ length: 5 }).map((_, i) => (
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
                        expenses.map((expense: Expense) => (
                            <TableRow key={expense.id} id={`expense-${expense.id}`} className={cn(expense.id === highlightedExpenseId && highlightClass, "transition-all")}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{expense.userName}</span>
                                        {expense.submittedFor && expense.submittedFor !== expense.userId && (
                                            <span className="text-xs text-muted-foreground">via {expense.userName}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{formatDateSafe(expense.date, 'dateOnly')}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{expense.title}</span>
                                        <span className="text-xs text-muted-foreground">{expense.items.length} item(s)</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-bold">{formatCurrency(expense.totalAmount)}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={statusColors[expense.status]}>
                                        {expense.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingExpense(expense)}>
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">View</span>
                                        </Button>
                                        
                                        {canApprove && expense.status === 'Pending' && expense.userId !== currentUser?.uid && (
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-100 h-8 w-8" onClick={() => handleStatusUpdate(expense, 'Approved')}>
                                                    <Check className="h-4 w-4" />
                                                    <span className="sr-only">Approve</span>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-100 h-8 w-8" onClick={() => handleStatusUpdate(expense, 'Rejected')}>
                                                    <X className="h-4 w-4" />
                                                    <span className="sr-only">Reject</span>
                                                </Button>
                                            </div>
                                        )}
                                        
                                        {canManageFinances && (expense.status === 'Approved' || expense.status === 'Rejected') && (
                                            <Button variant="ghost" size="icon" onClick={() => handleStatusUpdate(expense, 'Pending')} title="Reverse to Pending">
                                                <Undo2 className="h-4 w-4" />
                                                <span className="sr-only">Reverse</span>
                                            </Button>
                                        )}
                                        
                                        {canManageFinances && expense.status === 'Approved' && (
                                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleStatusUpdate(expense, 'Disbursed')}>
                                                Disburse
                                            </Button>
                                        )}
                                        
                                        {expense.status === 'Disbursed' && expense.userId === currentUser?.uid && (
                                            <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => handleStatusUpdate(expense, 'Acknowledged')}>
                                                <CheckCheck className="mr-1 h-3 w-3"/> Acknowledge
                                            </Button>
                                        )}

                                        {canManageFinances && (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingExpense(expense)}>
                                                    <Edit className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Delete</span>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete "{expense.title}"? This cannot be undone.
                                                            </AlertDialogDescription>
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
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No records found in this category.
                                </TableCell>
                            </TableRow>
                        )
                    )}
                </TableBody>
            </Table>
        </div>
    );
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
  const [activeTab, setActiveTab] = useState("all");

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    // Finance roles can see all expenses. Others see only their own.
    if (['Executive Director', 'Media & Finance Lead', 'Media & Communications Lead', 'Administrator'].includes(profile.role)) {
       return query(
        collection(firestore, 'expenses'), 
        orderBy('createdAt', 'desc')
      );
    }
    return query(
        collection(firestore, 'expenses'), 
        where('userId', '==', currentUser?.uid),
        orderBy('createdAt', 'desc')
    );
  }, [firestore, profile, currentUser?.uid]);
  
  const { data: expenses, isLoading, error } = useCollection<Expense>(expensesQuery);
  
  const financeUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', 'in', ['Executive Director', 'Media & Finance Lead', 'Media & Communications Lead']));
  }, [firestore]);
  const { data: financeUsers } = useCollection<User>(financeUsersQuery);

  const filteredExpenses = useMemo(() => {
      if (!expenses) return { all: [], requisitions: [], reimbursements: [] };
      return {
          all: expenses,
          requisitions: expenses.filter(e => e.type === 'Requisition'),
          reimbursements: expenses.filter(e => e.type === 'Reimbursement'),
      };
  }, [expenses]);

  const chartData = useMemo(() => {
    if (!expenses) return [];
    
    // Filter based on active tab concept if needed, but usually charts show overall health
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

    return Object.entries(categoryTotals)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5); // Top 5 categories
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
        
        // ... (Alert logic remains the same) ...
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
  
  if (error) {
      return (
           <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle/>Permission Denied</CardTitle>
                <CardDescription>Your current role does not have permission to view all expense reports.</CardDescription>
            </CardHeader>
        </Card>
      )
  }

  return (
    <>
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="h-8 w-8" />
          Finance & Bookkeeping
        </h1>
        <p className="text-muted-foreground">
          Manage requisitions, track reimbursements, and monitor spending.
        </p>
      </header>
      
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Transactions</CardTitle>
                  <CardDescription>Manage your financial records.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="all">All Records</TabsTrigger>
                            <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
                            <TabsTrigger value="reimbursements">Reimbursements</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="all">
                             <ExpensesTable 
                                expenses={filteredExpenses.all} 
                                isLoading={isLoading} 
                                highlightedExpenseId={highlightedExpenseId}
                                currentUser={currentUser}
                                canApprove={canApprove}
                                canManageFinances={canManageFinances}
                                handleStatusUpdate={handleStatusUpdate}
                                setViewingExpense={setViewingExpense}
                                setEditingExpense={setEditingExpense}
                                handleDelete={handleDelete}
                            />
                        </TabsContent>
                        <TabsContent value="requisitions">
                             <ExpensesTable 
                                expenses={filteredExpenses.requisitions} 
                                isLoading={isLoading} 
                                highlightedExpenseId={highlightedExpenseId}
                                currentUser={currentUser}
                                canApprove={canApprove}
                                canManageFinances={canManageFinances}
                                handleStatusUpdate={handleStatusUpdate}
                                setViewingExpense={setViewingExpense}
                                setEditingExpense={setEditingExpense}
                                handleDelete={handleDelete}
                            />
                        </TabsContent>
                         <TabsContent value="reimbursements">
                             <ExpensesTable 
                                expenses={filteredExpenses.reimbursements} 
                                isLoading={isLoading} 
                                highlightedExpenseId={highlightedExpenseId}
                                currentUser={currentUser}
                                canApprove={canApprove}
                                canManageFinances={canManageFinances}
                                handleStatusUpdate={handleStatusUpdate}
                                setViewingExpense={setViewingExpense}
                                setEditingExpense={setEditingExpense}
                                handleDelete={handleDelete}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5" /> Spending Breakdown</CardTitle>
                    <CardDescription>Top 5 Categories (Disbursed)</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading && <Skeleton className="w-full h-64" />}
                     {!isLoading && chartData.length > 0 && (
                        <ChartContainer config={chartConfig} className="w-full h-64">
                            <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} width={100} />
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
                            <p className="mt-4 font-semibold">No spending data available.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

             <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Quick Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 mt-0.5 text-blue-500" />
                        <div>
                            <span className="font-semibold block">Requisition</span>
                            Request funds *before* spending. Needs approval and disbursement.
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Receipt className="h-4 w-4 mt-0.5 text-purple-500" />
                        <div>
                            <span className="font-semibold block">Reimbursement</span>
                            Claim funds *after* spending personal money. Needs receipts.
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
    </div>
    <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Edit Transaction</DialogTitle>
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
