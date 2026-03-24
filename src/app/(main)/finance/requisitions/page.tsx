'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { Expense, User } from '@/lib/types';
import { formatCurrency, formatDateSafe, cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import { createAlertAction as createAlert } from '@/actions/mutations';
import Link from 'next/link';
import {
  FileText, Check, X, CheckCheck, PlusCircle
} from 'lucide-react';

const statusColors: Record<string, string> = {
  Pending: 'border-yellow-500 bg-yellow-500/10 text-yellow-600',
  Approved: 'border-blue-500 bg-blue-500/10 text-blue-600',
  Disbursed: 'border-purple-500 bg-purple-500/10 text-purple-600',
  Acknowledged: 'border-green-500 bg-green-500/10 text-green-600',
  Rejected: 'border-red-500 bg-red-500/10 text-red-600',
};

export default function RequisitionsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { toast } = useToast();

  const expensesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: allExpenses, isLoading } = useCollection<Expense>(expensesQuery);

  const requisitions = useMemo(() => allExpenses?.filter(e => e.type === 'Requisition') || [], [allExpenses]);

  const approvalRoles = ['Executive Director', 'Programs & Partnerships Manager', 'Operations & Field Manager'];
  const financeRoles = ['Executive Director', 'Media & Finance Lead', 'Administrator', 'Media & Communications Lead'];
  const canApprove = profile && approvalRoles.includes(profile.role);
  const canManageFinances = profile && financeRoles.includes(profile.role);

  const handleStatusUpdate = async (expense: Expense, status: Expense['status']) => {
    if (!firestore || !user) return;
    try {
      await updateDocumentNonBlocking(doc(firestore, 'expenses', expense.id), { status });
      toast({ title: `Requisition ${status}` });

      if (expense.userId !== user.uid) {
        let message = '';
        if (status === 'Approved') message = `Your requisition "${expense.title}" has been approved.`;
        else if (status === 'Rejected') message = `Your requisition "${expense.title}" has been rejected.`;
        else if (status === 'Disbursed') message = `Funds for "${expense.title}" have been disbursed. Please acknowledge receipt in My Finances.`;

        if (message) {
          await createAlert({
            type: status === 'Rejected' ? 'Urgent' : 'Info',
            message,
            priority: status === 'Disbursed' ? 'High' : 'Medium',
            action: '/my-finances',
            creatorId: user.uid,
            targetUserIds: [expense.userId],
          });
        }
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  };

  const pending = requisitions.filter(e => e.status === 'Pending');
  const approved = requisitions.filter(e => e.status === 'Approved');
  const disbursed = requisitions.filter(e => e.status === 'Disbursed');
  const acknowledged = requisitions.filter(e => e.status === 'Acknowledged');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-500" />
            Requisitions
          </h1>
          <p className="text-muted-foreground">Request funds before spending. Track approval and disbursement status.</p>
        </div>
        <Button asChild>
          <Link href="/forms/expense"><PlusCircle className="mr-2 h-4 w-4" /> New Requisition</Link>
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pending.length}</p>
            <p className="text-xs text-yellow-700 font-medium">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{approved.length}</p>
            <p className="text-xs text-blue-700 font-medium">Approved</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{disbursed.length}</p>
            <p className="text-xs text-purple-700 font-medium">Disbursed</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{acknowledged.length}</p>
            <p className="text-xs text-green-700 font-medium">Acknowledged</p>
          </CardContent>
        </Card>
      </div>

      {/* Requisition List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Requisitions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="sm:hidden space-y-3">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            {requisitions.map(expense => (
              <Card key={expense.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base truncate">{expense.title}</CardTitle>
                    <Badge variant="outline" className={statusColors[expense.status]}>{expense.status}</Badge>
                  </div>
                  <CardDescription>{expense.userName} · {formatDateSafe(expense.date, 'dateOnly')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">{formatCurrency(expense.totalAmount)}</p>
                </CardContent>
                <CardFooter className="flex gap-1 justify-end">
                  {canApprove && expense.status === 'Pending' && expense.userId !== user?.uid && (
                    <>
                      <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleStatusUpdate(expense, 'Approved')}><Check className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleStatusUpdate(expense, 'Rejected')}><X className="h-4 w-4" /></Button>
                    </>
                  )}
                  {canManageFinances && expense.status === 'Approved' && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(expense, 'Disbursed')}>Disburse</Button>
                  )}
                </CardFooter>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                ))}
                {requisitions.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.userName}</TableCell>
                    <TableCell>{expense.title}</TableCell>
                    <TableCell>{formatDateSafe(expense.date, 'dateOnly')}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(expense.totalAmount)}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[expense.status]}>{expense.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canApprove && expense.status === 'Pending' && expense.userId !== user?.uid && (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleStatusUpdate(expense, 'Approved')}><Check className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleStatusUpdate(expense, 'Rejected')}><X className="h-4 w-4" /></Button>
                          </>
                        )}
                        {canManageFinances && expense.status === 'Approved' && (
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleStatusUpdate(expense, 'Disbursed')}>Disburse</Button>
                        )}
                        {expense.status === 'Disbursed' && expense.userId === user?.uid && (
                          <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => handleStatusUpdate(expense, 'Acknowledged')}>
                            <CheckCheck className="mr-1 h-3 w-3" /> Acknowledge
                          </Button>
                        )}
                      </div>
                    </TableCell>
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
