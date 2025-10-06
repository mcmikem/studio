'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import type { Activity } from '@/lib/types';
import { Download, Loader2, BarChart, DollarSign, GitCommitHorizontal, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';


const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(value);
};

function MonthlyActivityReport() {
    const firestore = useFirestore();
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    const handleGenerateReport = async () => {
        setIsLoadingReport(true);
        const now = new Date();
        const startOfMonth = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1));
        const endOfMonth = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));

        const activitiesQuery = query(
            collection(firestore, 'activities'),
            where('loggedAt', '>=', startOfMonth),
            where('loggedAt', '<=', endOfMonth)
        );
        
        // This is a simplified "generation". In a real app, this would use getDocs
        // and aggregate on the client, or use a Cloud Function for server-side generation.
        // For now, we'll just set a flag and show a placeholder.
        
        // Simulate network delay
        await new Promise(res => setTimeout(res, 1500));

        // In a real scenario, you'd fetch and aggregate data here.
        // For this example, we'll just create some mock aggregated data.
        setReportData({
            month: format(now, 'MMMM yyyy'),
            totalActivities: 12,
            totalCost: 540000,
            totalValue: 1850000,
            averageRoi: 242,
        });

        setIsLoadingReport(false);
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Activity Report</CardTitle>
                <CardDescription>An overview of all field activities and their ROI for the selected month.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-end gap-4">
                    <div className="flex-grow">
                        <label htmlFor="month" className="text-sm font-medium text-muted-foreground">Report Month</label>
                        <Input id="month" type="month" defaultValue={format(new Date(), 'yyyy-MM')} />
                    </div>
                    <Button onClick={handleGenerateReport} disabled={isLoadingReport}>
                        {isLoadingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart className="mr-2 h-4 w-4" />}
                        Generate Report
                    </Button>
                </div>
                
                {isLoadingReport && (
                     <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {reportData && (
                    <Card className="bg-muted/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Report for {reportData.month}</CardTitle>
                                <CardDescription>Summary of key metrics.</CardDescription>
                            </div>
                             <Button variant="outline" size="sm" disabled>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                            </Button>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="flex flex-col items-center p-4 rounded-lg bg-background">
                                <GitCommitHorizontal className="h-8 w-8 text-primary mb-2" />
                                <p className="text-2xl font-bold">{reportData.totalActivities}</p>
                                <p className="text-sm text-muted-foreground">Activities Logged</p>
                            </div>
                             <div className="flex flex-col items-center p-4 rounded-lg bg-background">
                                <DollarSign className="h-8 w-8 text-red-500 mb-2" />
                                <p className="text-2xl font-bold">{formatCurrency(reportData.totalCost)}</p>
                                <p className="text-sm text-muted-foreground">Total Cost</p>
                            </div>
                             <div className="flex flex-col items-center p-4 rounded-lg bg-background">
                                <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                                <p className="text-2xl font-bold">{formatCurrency(reportData.totalValue)}</p>
                                <p className="text-sm text-muted-foreground">Total Value</p>
                            </div>
                             <div className="flex flex-col items-center p-4 rounded-lg bg-background">
                                <BarChart className="h-8 w-8 text-blue-500 mb-2" />
                                <p className="text-2xl font-bold">{reportData.averageRoi.toFixed(0)}%</p>
                                <p className="text-sm text-muted-foreground">Average ROI</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

            </CardContent>
        </Card>
    )
}

import { Input } from '@/components/ui/input';
export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Reports
        </h1>
        <p className="text-muted-foreground">
          View and download automatically generated reports.
        </p>
      </header>
      <MonthlyActivityReport />
    </div>
  );
}
