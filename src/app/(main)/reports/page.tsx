'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, getDocs } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import type { Activity } from '@/lib/types';
import { Download, Loader2, BarChart, DollarSign, GitCommitHorizontal, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';


function MonthlyActivityReport() {
    const firestore = useFirestore();
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

    const handleGenerateReport = async () => {
        setIsLoadingReport(true);
        setReportData(null);
        if (!firestore) {
            setIsLoadingReport(false);
            return;
        }

        const [year, month] = selectedMonth.split('-');
        const startDate = Timestamp.fromDate(new Date(parseInt(year), parseInt(month) - 1, 1));
        const endDate = Timestamp.fromDate(new Date(parseInt(year), parseInt(month), 0, 23, 59, 59));

        const activitiesQuery = query(
            collection(firestore, 'activities'),
            where('loggedAt', '>=', startDate),
            where('loggedAt', '<=', endDate)
        );
        
        try {
            const snapshot = await getDocs(activitiesQuery);
            const activities = snapshot.docs.map(doc => doc.data() as Activity);

            if (activities.length === 0) {
              setReportData({
                month: format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy'),
                totalActivities: 0,
                totalCost: 0,
                totalValue: 0,
                averageRoi: 0,
              });
              return;
            }

            const totalCost = activities.reduce((sum, act) => sum + act.actualCost, 0);
            const totalValue = activities.reduce((sum, act) => sum + act.totalValue, 0);
            const averageRoi = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

            setReportData({
                month: format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy'),
                totalActivities: activities.length,
                totalCost,
                totalValue,
                averageRoi,
            });

        } catch (error) {
            console.error("Error generating report: ", error);
            // Handle error toast if necessary
        } finally {
            setIsLoadingReport(false);
        }
    }
    
    const summaryCards = reportData ? [
        { key: 'activities', icon: GitCommitHorizontal, value: reportData.totalActivities, label: 'Activities' },
        { key: 'cost', icon: DollarSign, value: formatCurrency(reportData.totalCost), label: 'Total Cost', color: 'text-red-500' },
        { key: 'value', icon: TrendingUp, value: formatCurrency(reportData.totalValue), label: 'Total Value', color: 'text-green-500' },
        { key: 'roi', icon: BarChart, value: `${reportData.averageRoi.toFixed(0)}%`, label: 'Average ROI', color: 'text-blue-500' },
    ] : [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Activity Report</CardTitle>
                <CardDescription>An overview of all field activities and their ROI for the selected month.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-end gap-4">
                    <div className="flex-grow">
                        <Label htmlFor="month">Report Month</Label>
                        <Input id="month" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                    </div>
                    <Button onClick={handleGenerateReport} disabled={isLoadingReport}>
                        {isLoadingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart className="mr-2 h-4 w-4" />}
                        Generate Report
                    </Button>
                </div>
                
                {isLoadingReport && (
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                )}

                {reportData && (
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle>Summary for {reportData.month}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {summaryCards.map(card => (
                                <div key={card.key} className="flex flex-col items-center justify-center p-4 rounded-lg bg-background text-center">
                                    <card.icon className={`h-8 w-8 mb-2 ${card.color || 'text-primary'}`} />
                                    <p className="text-3xl font-bold">{card.value}</p>
                                    <p className="text-sm text-muted-foreground">{card.label}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </CardContent>
        </Card>
    )
}

function FinancialOverview({ activities }: { activities: Activity[] | null }) {
    
  const { totalSpent, totalValue, isLoading } = useMemo(() => {
    if (!activities) return { totalSpent: 0, totalValue: 0, isLoading: true };
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyActivities = activities.filter(act => {
        // Ensure loggedAt is a valid date before comparison
        if (!act.loggedAt || typeof act.loggedAt.toDate !== 'function') return false;
        return act.loggedAt.toDate() >= startOfMonth;
    });

    const spent = monthlyActivities.reduce((sum, activity) => sum + activity.actualCost, 0);
    const value = monthlyActivities.reduce((sum, activity) => sum + activity.totalValue, 0);
    
    return { totalSpent: spent, totalValue: value, isLoading: false };
  }, [activities]);

  const monthlyBudget = 2000000 // Mock budget for now
  const remainingBudget = monthlyBudget - totalSpent

  return (
      <Card>
          <CardHeader>
              <CardTitle>This Month's Financial Snapshot</CardTitle>
              <CardDescription>A summary of spending and value generation for the current month.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
            ) : (
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
                        <p className="text-sm text-muted-foreground">
                            of {formatCurrency(monthlyBudget)} spent
                        </p>
                        </CardContent>
                    </Card>
                    <Card className="flex flex-col justify-between">
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-500">
                            <TrendingUp />
                            Value Generated
                        </CardTitle>
                        </CardHeader>
                        <CardContent>
                        <p className="text-3xl font-bold">{formatCurrency(totalValue)}</p>
                        <p className="text-sm text-muted-foreground">
                            from this month's activities
                        </p>
                        </CardContent>
                    </Card>
                    <Card className="flex flex-col justify-between">
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-500">
                            <DollarSign />
                            Remaining Budget
                        </CardTitle>
                        </CardHeader>
                        <CardContent>
                        <p className="text-3xl font-bold">
                            {formatCurrency(remainingBudget)}
                        </p>
                        <p className="text-sm text-muted-foreground">for the rest of the month</p>
                        </CardContent>
                    </Card>
                </div>
            )}
          </CardContent>
      </Card>
  )
}

export default function ReportsPage() {
  const firestore = useFirestore();
  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return query(
      collection(firestore, "activities"),
      where("loggedAt", ">=", Timestamp.fromDate(startOfMonth))
    );
  }, [firestore]);
  
  const { data: activities } = useCollection<Activity>(activitiesQuery);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          M&amp;E Hub
        </h1>
        <p className="text-muted-foreground">
          Turn your operational data into actionable intelligence.
        </p>
      </header>
      <FinancialOverview activities={activities} />
      <MonthlyActivityReport />
    </div>
  );
}
