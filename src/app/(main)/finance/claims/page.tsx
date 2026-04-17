'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Expense } from '@/lib/types';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import Link from 'next/link';
import { ReceiptText, PlusCircle, Check, X, CheckCheck } from 'lucide-react';

const statusColors: Record<string, string> = {
  Pending: 'border-yellow-500 bg-yellow-500/10 text-yellow-600',
  Approved: 'border-blue-500 bg-blue-500/10 text-blue-600',
  Disbursed: 'border-purple-500 bg-purple-500/10 text-purple-600',
  Acknowledged: 'border-green-500 bg-green-500/10 text-green-600',
  Rejected: 'border-red-500 bg-red-500/10 text-red-600',
};

export default function ClaimsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);

  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: allExpenses, isLoading } = useCollection<Expense>(expensesQuery);

  const reimbursements = useMemo(() => allExpenses?.filter(e => e.type === 'Reimbursement') || [], [allExpenses]);

  const pending = reimbursements.filter(e => e.status === 'Pending');
  const approved = reimbursements.filter(e => e.status === 'Approved');
  const disbursed = reimbursements.filter(e => e.status === 'Disbursed');
  const totalPending = pending.reduce((s, e) => s + Number(e.totalAmount || 0), 0);
  const totalApproved = approved.reduce((s, e) => s + Number(e.totalAmount || 0), 0);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
            <ReceiptText className="h-8 w-8 text-purple-500" />
            Claims & Refunds
          </h1>
          <p className="text-muted-foreground">Submit reimbursement claims for money you've already spent.</p>
        </div>
        <Button asChild>
          <Link href="/forms/expense"><PlusCircle className="mr-2 h-4 w-4" /> New Claim</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-yellow-700">Pending Claims</p>
            <p className="text-2xl font-bold text-yellow-700">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-yellow-600">{pending.length} claims</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-blue-700">Approved</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalApproved)}</p>
            <p className="text-xs text-blue-600">{approved.length} claims</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-purple-700">Disbursed</p>
            <p className="text-2xl font-bold text-purple-700">{disbursed.length}</p>
            <p className="text-xs text-purple-600">Awaiting acknowledgment</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Claims</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="sm:hidden space-y-3">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            {reimbursements.map(expense => (
              <Card key={expense.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base truncate">{expense.title}</CardTitle>
                    <Badge variant="outline" className={statusColors[expense.status]}>{expense.status}</Badge>
                  </div>
                  <CardDescription>{formatDateSafe(expense.date, 'dateOnly')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">{formatCurrency(expense.totalAmount)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reimbursements.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.userName}</TableCell>
                    <TableCell>{expense.title}</TableCell>
                    <TableCell>{formatDateSafe(expense.date, 'dateOnly')}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(expense.totalAmount)}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[expense.status]}>{expense.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
