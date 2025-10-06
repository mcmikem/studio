'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { Activity } from '@/lib/types';
import { Banknote, FileUp, FolderKanban, Loader2, DollarSign, Target, VenetianMask, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(value);
};


function FinancialOverview() {
    const firestore = useFirestore();

    const startOfMonth = useMemoFirebase(() => {
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

export default function MediaFinancePage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
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
        <Card>
            <CardHeader>
                <CardTitle>Expense Reporting</CardTitle>
                <CardDescription>Submit and track expense reports for reimbursement.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-lg h-full">
                     <p className="text-muted-foreground mb-4">The new Expense Report form is now available in the Forms Hub.</p>
                     <Button asChild>
                        <Link href="/forms">Go to Forms Hub <ArrowRight className="ml-2 h-4 w-4" /></Link>
                     </Button>
                </div>
            </CardContent>
        </Card>
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
