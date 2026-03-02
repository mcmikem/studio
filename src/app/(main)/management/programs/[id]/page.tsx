'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import type { Program, Kpi, FinancialSummary, Transaction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, ArrowLeft, BarChart3, ClipboardEdit } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateSafe } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import ProgramKPIs from '@/components/program/program-kpis';
import ProgramFinancialSummary from '@/components/program/financial-summary';

const statusColors: { [key: string]: string } = {
  "On Track": "border-green-500 bg-green-500/10 text-green-500",
  "At Risk": "border-yellow-500 bg-yellow-500/10 text-yellow-500",
  "Delayed": "border-red-500 bg-red-500/10 text-red-500",
  "Completed": "border-primary bg-primary/10 text-primary",
};

function ProgramDashboard() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const firestore = useFirestore();

  const programDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'programs', id);
  }, [firestore, id]);

  const kpisQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, 'impact-metrics'), where('programId', '==', id));
  }, [firestore, id]);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, 'transactions'), where('programId', '==', id));
  }, [firestore, id]);

  const { data: program, isLoading: isLoadingProgram } = useDoc<Program>(programDocRef);
  const { data: kpis, isLoading: isLoadingKpis } = useCollection<Kpi>(kpisQuery);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  const financialSummary: FinancialSummary = {
    budget: program?.budget || 0,
    spent: transactions?.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0) || 0,
    income: transactions?.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) || 0,
    net: (program?.budget || 0) - (transactions?.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0) || 0) + (transactions?.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) || 0),
  };

  const isLoading = isLoadingProgram || isLoadingKpis || isLoadingTransactions;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!program) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Program Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The requested program could not be found.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/management/programs"><ArrowLeft className="mr-2 h-4 w-4" />Back to Programs</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header>
         <Button asChild variant="outline" className="mb-4">
            <Link href="/management/programs"><ArrowLeft className="mr-2 h-4 w-4" />Back to All Programs</Link>
          </Button>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-3">
          <FolderKanban className="h-8 w-8" />
          {program.title}
        </h1>
        <p className="text-muted-foreground">
          A detailed dashboard for the {program.title} program.
        </p>
      </header>

       <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>Program Snapshot</CardTitle>
            <Badge variant="outline" className={statusColors[program.status]}>
              {program.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Program Lead</p>
            <p className="font-semibold">{program.lead}</p>
          </div>
           <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Deadline</p>
            <p className="font-semibold">{formatDateSafe(program.deadline, 'dateOnly')}</p>
          </div>
          <div className="md:col-span-3 space-y-2">
            <h4 className="text-sm font-semibold">Key Objectives</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {program.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardEdit /> Data Collection Forms</CardTitle>
              <CardDescription>Use these forms to log data for the {program.title} program.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
              <Link href={`/forms/activity?programId=${program.id}&programName=${encodeURIComponent(program.title)}`} className="block">
                  <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <BarChart3 className="h-8 w-8 text-primary" />
                      <div>
                          <p className="font-semibold">Log a New Activity (ROI)</p>
                          <p className="text-sm text-muted-foreground">Report a field activity and calculate its return on investment for this program.</p>
                      </div>
                  </div>
              </Link>
          </CardContent>
        </Card>
        {kpis && kpis.length > 0 ? (
          <ProgramKPIs kpis={kpis} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Program KPIs</CardTitle>
              <CardDescription>Key performance indicators for this program.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-12">No KPIs have been linked to this program yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
      {financialSummary && transactions ? (
        <ProgramFinancialSummary summary={financialSummary} transactions={transactions} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Financial health of the {program.title} program.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-12">No financial data has been recorded for this program yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ProgramPage() {
    return <ProgramDashboard />;
}
