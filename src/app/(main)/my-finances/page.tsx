
'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Expense } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Receipt } from 'lucide-react';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

const statusColors: { [key: string]: string } = {
  Pending: 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
  Approved: 'border-blue-500 bg-blue-500/10 text-blue-500',
  Disbursed: 'border-purple-500 bg-purple-500/10 text-purple-500',
  Acknowledged: 'border-green-500 bg-green-500/10 text-green-500',
  Rejected: 'border-red-500 bg-red-500/10 text-red-500',
};

export default function MyFinancesPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userExpensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'expenses'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: expenses, isLoading } = useCollection<Expense>(userExpensesQuery);

  const financialSummary = useMemo(() => {
    if (!expenses) return { fundsHeld: 0, pendingReimbursement: 0 };

    const fundsHeld = expenses
      .filter(e => e.type === 'Requisition' && e.status === 'Disbursed')
      .reduce((sum, e) => sum + e.totalAmount, 0);

    const pendingReimbursement = expenses
      .filter(e => e.type === 'Reimbursement' && e.status === 'Approved')
      .reduce((sum, e) => sum + e.totalAmount, 0);

    return { fundsHeld, pendingReimbursement };
  }, [expenses]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          My Finances
        </h1>
        <p className="text-muted-foreground">
          A personal ledger of your funds, requests, and reimbursements.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Funds I'm Holding</CardTitle>
            <CardDescription>Money disbursed to you for activities that has not yet been accounted for via an expense report.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-32" /> : (
              <p className="text-3xl font-bold">{formatCurrency(financialSummary.fundsHeld)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>My Pending Reimbursements</CardTitle>
            <CardDescription>Approved personal expenses waiting to be paid back to you by the organization.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-32" /> : (
              <p className="text-3xl font-bold text-green-500">{formatCurrency(financialSummary.pendingReimbursement)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Expense Report History</CardTitle>
          <CardDescription>A log of all expense reports you have submitted.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                </TableRow>
              ))}
              {expenses && expenses.length > 0 ? (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDateSafe(expense.date, 'dateOnly')}</TableCell>
                    <TableCell className="font-medium">{expense.title}</TableCell>
                    <TableCell>{expense.type}</TableCell>
                    <TableCell>{formatCurrency(expense.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[expense.status]}>
                        {expense.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48">
                      <EmptyState
                        icon={Receipt}
                        title="No Expense Reports"
                        description="You haven't submitted any reports yet. You can create one from the Forms Hub."
                        className="min-h-0"
                      />
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
