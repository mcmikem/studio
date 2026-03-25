'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { collection, query, where, Timestamp, getDocs } from 'firebase/firestore';
import { useState } from 'react';
import type { Activity, Checkout, Expense, Testimony } from '@/lib/types';
import { Download, Loader2, BarChart, DollarSign, GitCommitHorizontal, TrendingUp, ArrowRight, Wand, BookOpen, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Parser } from 'json2csv';

function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  const parser = new Parser();
  const csv = parser.parse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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

    const activitiesQuery = query(collection(firestore, 'activities'), where('loggedAt', '>=', startDate), where('loggedAt', '<=', endDate));
    const checkoutsQuery = query(collection(firestore, 'checkouts'), where('timestamp', '>=', startDate), where('timestamp', '<=', endDate));
    const expensesQuery = query(collection(firestore, 'expenses'), where('createdAt', '>=', startDate), where('createdAt', '<=', endDate));
    const testimoniesQuery = query(collection(firestore, 'testimonies'), where('createdAt', '>=', startDate), where('createdAt', '<=', endDate));

    try {
      const [activitiesSnap, checkoutsSnap, expensesSnap, testimoniesSnap] = await Promise.all([
        getDocs(activitiesQuery),
        getDocs(checkoutsQuery),
        getDocs(expensesQuery),
        getDocs(testimoniesQuery),
      ]);

      const activities = activitiesSnap.docs.map((doc) => doc.data() as Activity);
      const checkouts = checkoutsSnap.docs.map((doc) => doc.data() as Checkout);
      const expenses = expensesSnap.docs.map((doc) => doc.data() as Expense);
      const testimonies = testimoniesSnap.docs.map((doc) => doc.data() as Testimony);

      const totalCost = activities.reduce((sum, act) => sum + (act.actualCost || 0), 0);
      const totalValue = activities.reduce((sum, act) => sum + (act.totalValue || 0), 0);
      const averageRoi = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.totalAmount || 0), 0);
      const uniqueStaff = new Set(checkouts.map((c) => c.userId)).size;

      setReportData({
        month: format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy'),
        totalActivities: activities.length,
        totalCost,
        totalValue,
        averageRoi,
        checkoutsCount: checkouts.length,
        uniqueStaff,
        totalExpenses,
        testimoniesCount: testimonies.length,
        activities,
        checkouts,
        expenses,
        testimonies,
      });
    } catch (error) {
      console.error('Error generating report: ', error);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleDownloadCompiled = () => {
    if (!reportData) return;
    const rows: Array<Record<string, string | number>> = [];
    reportData.activities.forEach((a: Activity) => rows.push({ section: 'Activity', date: format(new Date(a.loggedAt?.seconds ? a.loggedAt.seconds * 1000 : Date.now()), 'yyyy-MM-dd'), item: a.title, cost: a.actualCost || 0, value: a.totalValue || 0, owner: a.userName || '' }));
    reportData.checkouts.forEach((c: Checkout) => rows.push({ section: 'Checkout', date: format(new Date(c.timestamp?.seconds ? c.timestamp.seconds * 1000 : Date.now()), 'yyyy-MM-dd'), item: `${c.tasks?.length || 0} tasks submitted`, cost: '', value: '', owner: c.name }));
    reportData.expenses.forEach((e: Expense) => rows.push({ section: 'Expense', date: format(new Date(e.createdAt?.seconds ? e.createdAt.seconds * 1000 : Date.now()), 'yyyy-MM-dd'), item: e.title || 'Expense', cost: e.totalAmount || 0, value: '', owner: e.userName || '' }));
    reportData.testimonies.forEach((t: Testimony) => rows.push({ section: 'Testimony', date: format(new Date(t.createdAt?.seconds ? t.createdAt.seconds * 1000 : Date.now()), 'yyyy-MM-dd'), item: t.title, cost: '', value: '', owner: t.userName }));

    downloadCsv(`compiled-org-report-${selectedMonth}.csv`, rows);
  };

  const summaryCards = reportData
    ? [
        { key: 'activities', icon: GitCommitHorizontal, value: reportData.totalActivities, label: 'Activities' },
        { key: 'cost', icon: DollarSign, value: formatCurrency(reportData.totalCost), label: 'Field Cost', color: 'text-red-500' },
        { key: 'value', icon: TrendingUp, value: formatCurrency(reportData.totalValue), label: 'Field Value', color: 'text-green-500' },
        { key: 'roi', icon: BarChart, value: `${reportData.averageRoi.toFixed(0)}%`, label: 'Average ROI', color: 'text-blue-500' },
        { key: 'checkouts', icon: Users, value: reportData.checkoutsCount, label: 'Checkouts' },
        { key: 'expenses', icon: DollarSign, value: formatCurrency(reportData.totalExpenses), label: 'Finance Spend', color: 'text-orange-500' },
        { key: 'stories', icon: BookOpen, value: reportData.testimoniesCount, label: 'Success Stories' },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Activity Report</CardTitle>
        <CardDescription>Compiled organizational report: activities, checkouts, expenses, and success stories.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-grow w-full">
            <Label htmlFor="month">Report Month</Label>
            <Input id="month" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          </div>
          <Button onClick={handleGenerateReport} disabled={isLoadingReport}>
            {isLoadingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart className="mr-2 h-4 w-4" />}Generate Report
          </Button>
          <Button variant="outline" onClick={handleDownloadCompiled} disabled={!reportData}><Download className="mr-2 h-4 w-4" />Download CSV</Button>
        </div>

        {isLoadingReport && <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>}

        {reportData && (
          <Card className="bg-muted/50">
            <CardHeader><CardTitle>Summary for {reportData.month}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {summaryCards.map((card) => (
                <div key={card.key} className="flex flex-col items-center justify-center p-4 rounded-lg bg-background text-center">
                  <card.icon className={`h-7 w-7 mb-2 ${card.color || 'text-primary'}`} />
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2"><BarChart3 className="h-8 w-8" />Reports</h1>
        <p className="text-muted-foreground">Turn your operational data into actionable intelligence.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>AI Program Deep Dive</CardTitle>
          <CardDescription>Program-level performance analysis based on submitted data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/reports/deep-dive"><Wand className="mr-2 h-4 w-4" />Launch Program Deep Dive<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </CardContent>
      </Card>
      <MonthlyActivityReport />
    </div>
  );
}
