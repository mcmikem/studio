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
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import type { Expense } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Receipt } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

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
};

const formatDateSafe = (dateValue: Timestamp | { toDate: () => Date } | string | null | undefined): string => {
  if (!dateValue) return 'Invalid Date';

  try {
    let date: Date;
    if (typeof (dateValue as any).toDate === 'function') {
      date = (dateValue as { toDate: () => Date }).toDate();
    } else if (typeof dateValue === 'string') {
      date = parseISO(dateValue);
       if (isValid(date)) {
        const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
        date = adjustedDate;
      }
    } else {
      date = dateValue as Date;
    }

    if (isValid(date)) {
      return format(date, 'dd MMM yyyy');
    }
  } catch (e) {
    // Fall through if any parsing fails
  }

  return 'Invalid Date';
};


export default function ExpensesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery);

  const handleStatusUpdate = (expenseId: string, status: 'Approved' | 'Rejected') => {
    if (!firestore) return;
    const expenseRef = doc(firestore, 'expenses', expenseId);
    updateDoc(expenseRef, { status: status });
    toast({
      title: `Expense ${status}`,
      description: `The expense report has been marked as ${status.toLowerCase()}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Management</CardTitle>
        <CardDescription>
          Review, approve, or reject expense reports submitted by the team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
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
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))}
            {expenses && expenses.length > 0 ? (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.userName}</TableCell>
                  <TableCell>{formatDateSafe(expense.date)}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{expense.category}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(expense.amount)}</TableCell>
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
                          className="text-green-500 hover:text-green-600"
                          onClick={() => handleStatusUpdate(expense.id, 'Approved')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleStatusUpdate(expense.id, 'Rejected')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="h-12 w-12" />
                      <span className="text-lg font-semibold">
                        No Expenses Found
                      </span>
                      <p className="text-sm">
                        No expense reports have been submitted yet.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
