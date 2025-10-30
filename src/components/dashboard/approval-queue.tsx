
'use client';

import { useMemo } from 'react';
import type { Expense } from "@/lib/types"
import { useCollection, useFirestore, useUser, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Check, X, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createAlert } from '@/ai/flows/create-alert-flow';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';

export function ApprovalQueue() {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const { toast } = useToast();

    const pendingExpensesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'expenses'),
            where('status', '==', 'Pending'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);

    const { data: pendingExpenses, isLoading } = useCollection<Expense>(pendingExpensesQuery);

    const handleStatusUpdate = async (expense: Expense, status: 'Approved' | 'Rejected') => {
        if (!firestore || !currentUser) return;
        const expenseRef = doc(firestore, 'expenses', expense.id);
        try {
            await updateDocumentNonBlocking(expenseRef, { status });
            toast({
                title: `Expense ${status}`,
                description: `The expense from ${expense.userName} has been marked as ${status.toLowerCase()}.`,
            });

            if (expense.userId !== currentUser.uid) {
                await createAlert({
                    type: 'Info',
                    message: `Your expense report for '${expense.title}' has been ${status.toLowerCase()}.`,
                    priority: 'Medium',
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
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet /> Financial Queue</CardTitle>
                <CardDescription>
                    Approve or reject new expense reports.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Request</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && Array.from({length: 2}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell>
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2 mt-2" />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Skeleton className="h-8 w-20 ml-auto" />
                                </TableCell>
                            </TableRow>
                        ))}
                        {pendingExpenses && pendingExpenses.length > 0 ? (
                            pendingExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>
                                        <div className="font-medium">{expense.userName}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {expense.title} - {formatCurrency(expense.totalAmount)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600" onClick={() => handleStatusUpdate(expense, 'Approved')}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleStatusUpdate(expense, 'Rejected')}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center">
                                        The approval queue is empty.
                                    </TableCell>
                                </TableRow>
                            )
                        )}
                    </TableBody>
                </Table>
                 <Button variant="link" asChild className="w-full mt-2">
                    <Link href="/management/expenses">View All Expenses</Link>
                </Button>
            </CardContent>
        </Card>
    )
}
