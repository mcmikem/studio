
'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Expense } from "@/lib/types"
import { useCollection, useFirestore, useUser, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, orderBy, doc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Check, X, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createAlertAction as createAlert } from '@/actions/mutations';
import { formatCurrency } from '@/lib/utils';

import { Skeleton } from '../ui/skeleton';
import { EmptyState } from '../ui/empty-state';
import Link from 'next/link';

export function ApprovalQueue() {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const { toast } = useToast();
    const [pendingExpenses, setPendingExpenses] = useState<Expense[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firestore) {
            setIsLoading(false);
            return;
        };

        const q = query(
            collection(firestore, 'expenses'),
            where('status', '==', 'Pending'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
                setPendingExpenses(expenses);
                setIsLoading(false);
            },
            (error) => {
                console.error("Error fetching pending expenses:", error);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [firestore]);


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
                    targetUserIds: [expense.userId]
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
        <Card className="rounded-[2rem] border-lg border-omuto-navy shadow-comic-sm bg-white overflow-hidden flex flex-col">
            <CardHeader className="bg-omuto-cream/50 border-b-lg border-omuto-navy/10 pb-4 pt-6 px-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Wallet className="h-5 w-5" /></div>
                    <div>
                        <CardTitle className="font-heading text-xl font-bold tracking-tight text-omuto-navy">Financial Queue</CardTitle>
                        <CardDescription className="font-bold text-omuto-navy/50 text-[10px] uppercase tracking-widest mt-1">
                            Action new expense reports
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
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
                                    <TableCell colSpan={2} className="h-32 text-center p-0">
                                        <EmptyState icon={Check} title="Queue Empty" description="All expenses have been reviewed." className="border-none rounded-none w-full h-full min-h-[150px] bg-transparent pb-0" />
                                    </TableCell>
                                </TableRow>
                            )
                        )}
                    </TableBody>
                </Table>
                <div className="mt-auto p-4 border-t border-omuto-navy/10 bg-muted/20">
                    <Button variant="outline" asChild className="w-full bg-white hover:bg-omuto-cream border-omuto-navy text-omuto-navy font-bold shadow-sm hover:-translate-y-0.5 transition-all">
                        <Link href="/management/expenses">View All Expenses</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
