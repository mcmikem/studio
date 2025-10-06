'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy, limit } from 'firebase/firestore';
import type { Activity, Expense } from '@/lib/types';
import { Banknote, FileUp, FolderKanban, Loader2, DollarSign, Target, VenetianMask, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDateSafe = (timestamp: Timestamp | { toDate: () => Date } | null | undefined): string => {
    if (!timestamp) return 'Invalid Date';
    if (typeof (timestamp as any).toDate === 'function') {
      try {
        const date = (timestamp as { toDate: () => Date }).toDate();
        if (!isNaN(date.getTime())) {
          return format(date, 'dd MMM yyyy');
        }
      } catch (e) {
         // Fall through
      }
    }
    return 'Invalid Date';
  };


function FinancialOverview() {
    const firestore = useFirestore();

    const startOfMonth = useMemo(() => {
        const now = new Date();
        return Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1));
    }, []);

    const activitiesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'activities'),
            where('loggedAt', '>=', startOfMonth)
        );
    }, [firestore, startOfMonth]);

    const { data: activities, isLoading } = useCollection<Activity>(activitiesQuery);

    const monthlyBudget = 2000000; // Mock budget for now

    const totalSpent = useMemo(() => {
        return activities?.reduce((sum, activity) => sum + activity.actualCost, 0) || 0;
    }, [activities]);

    const totalValue = useMemo(() => {
        return activities?.reduce((sum, activity) => sum + activity.totalValue, 0) || 0;
    }, [activities]);

    const remainingBudget = monthlyBudget - totalSpent;
    const progress = (totalSpent / monthlyBudget) * 100;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="flex flex-col justify-between">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <DollarSign />
                        Monthly Spending
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{formatCurrency(totalSpent)}</p>
                    <p className="text-sm text-muted-foreground">of {formatCurrency(monthlyBudget)} spent</p>
                </CardContent>
            </Card>
            <Card className="flex flex-col justify-between">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-500">
                        <Target />
                        Value Generated
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-3xl font-bold">{formatCurrency(totalValue)}</p>
                    <p className="text-sm text-muted-foreground">from this month's activities</p>
                </CardContent>
            </Card>
             <Card className="flex flex-col justify-between">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-500">
                        <VenetianMask />
                        Remaining Budget
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{formatCurrency(remainingBudget)}</p>
                    <p className="text-sm text-muted-foreground">for the rest of the month</p>
                </CardContent>
            </Card>
        </div>
    )
}

function RecentExpenses() {
    const firestore = useFirestore();
    const expensesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc'), limit(5));
    }, [firestore]);

    const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery);

    const statusColors: { [key: string]: string } = {
        Pending: "border-yellow-500 bg-yellow-500/10 text-yellow-500",
        Approved: "border-green-500 bg-green-500/10 text-green-500",
        Rejected: "border-red-500 bg-red-500/10 text-red-500",
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Expense Reporting</CardTitle>
                <CardDescription>Submit and track expense reports for reimbursement.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && Array.from({length: 3}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            </TableRow>
                        ))}
                        {expenses && expenses.length > 0 ? (
                            expenses.map(expense => (
                                <TableRow key={expense.id}>
                                    <TableCell>{formatDateSafe(expense.date)}</TableCell>
                                    <TableCell>{expense.description}</TableCell>
                                    <TableCell>{formatCurrency(expense.amount)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={statusColors[expense.status]}>{expense.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">No recent expenses.</TableCell>
                                </TableRow>
                            )
                        )}
                    </TableBody>
                 </Table>
                 <Button asChild className="mt-4 w-full">
                    <Link href="/forms?tab=expense">Go to Forms Hub to submit an expense <ArrowRight className="ml-2 h-4 w-4" /></Link>
                 </Button>
            </CardContent>
        </Card>
    )
}

export default function MediaFinancePage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
            <Banknote className="h-8 w-8" />
            Media & Finance
        </h1>
        <p className="text-muted-foreground">
          Manage communications, finances, and visibility.
        </p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>A summary of this month's spending and value generation.</CardDescription>
        </CardHeader>
        <CardContent>
            <FinancialOverview />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <RecentExpenses />
         <Card>
            <CardHeader>
                <CardTitle>Media Asset Library</CardTitle>
                <CardDescription>A central place for all photos, videos, and brand assets.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-lg h-full">
                    <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">Under Development</h3>
                    <p className="text-muted-foreground text-sm">A searchable library for all media content is coming soon.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
