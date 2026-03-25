'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, Timestamp, getDocs } from 'firebase/firestore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, subDays } from 'date-fns';
import type { Program, QualitativeAnalysisOutput, Activity, Beneficiary, Testimony } from '@/lib/types';
import { runQualitativeAnalysis } from '@/ai/actions';
import { callAIOfflineFirst, offlineQualitativeAnalysis } from '@/lib/offline-ai';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Wand, Loader2, Lightbulb, AlertTriangle, CheckCircle, BarChart3, Users, Video } from 'lucide-react';

const analysisSchema = z.object({
  programId: z.string().min(1, 'Please select a program.'),
  startDate: z.string().min(1, 'Please select a start date.'),
  endDate: z.string().min(1, 'Please select an end date.'),
});

type AnalysisFormData = z.infer<typeof analysisSchema>;

function AnalysisResultDisplay({ results }: { results: QualitativeAnalysisOutput }) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Qualitative Analysis Results</CardTitle>
        <CardDescription>A summary of themes and insights from the selected period.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <BrainCircuit className="h-4 w-4" />
          <AlertTitle className="font-bold">Executive Summary</AlertTitle>
          <AlertDescription>{results.summary}</AlertDescription>
        </Alert>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-green-600"><CheckCircle className="h-5 w-5" /> Recurring Successes</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside space-y-2 text-sm">{results.recurringSuccesses.map((item, index) => <li key={index}>{item}</li>)}</ul></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-yellow-600"><AlertTriangle className="h-5 w-5" /> Common Challenges</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside space-y-2 text-sm">{results.commonChallenges.map((item, index) => <li key={index}>{item}</li>)}</ul></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-blue-600"><Lightbulb className="h-5 w-5" /> Key Learnings</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside space-y-2 text-sm">{results.keyLearnings.map((item, index) => <li key={index}>{item}</li>)}</ul></CardContent></Card>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProgramDeepDivePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<QualitativeAnalysisOutput | null>(null);
  const [snapshot, setSnapshot] = useState<{ beneficiaries: number; activities: number; testimonies: number; totalValue: number; totalCost: number } | null>(null);
  const { toast } = useToast();

  const firestore = useFirestore();
  const programsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'programs'), orderBy('title')) : null), [firestore]);
  const { data: programs, isLoading: isLoadingPrograms } = useCollection<Program>(programsQuery);

  const { register, handleSubmit, control, formState: { errors } } = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = async (data: AnalysisFormData) => {
    setIsLoading(true);
    setAnalysisResult(null);
    setSnapshot(null);

    const selectedProgram = programs?.find((p) => p.id === data.programId);
    if (!selectedProgram || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selected program not found.' });
      setIsLoading(false);
      return;
    }

    try {
      const startTs = Timestamp.fromDate(new Date(`${data.startDate}T00:00:00`));
      const endTs = Timestamp.fromDate(new Date(`${data.endDate}T23:59:59`));

      const [activitiesSnap, beneficiariesSnap, testimoniesSnap] = await Promise.all([
        getDocs(query(collection(firestore, 'activities'), where('loggedAt', '>=', startTs), where('loggedAt', '<=', endTs), where('primaryGoalId', '==', data.programId))),
        getDocs(query(collection(firestore, 'beneficiaries'), where('programEnrolled', '==', selectedProgram.title))),
        getDocs(query(collection(firestore, 'testimonies'), where('createdAt', '>=', startTs), where('createdAt', '<=', endTs), where('project', '==', selectedProgram.title))),
      ]);

      const activities = activitiesSnap.docs.map((doc) => doc.data() as Activity);
      const totalValue = activities.reduce((sum, a) => sum + (a.totalValue || 0), 0);
      const totalCost = activities.reduce((sum, a) => sum + (a.actualCost || 0), 0);

      setSnapshot({
        beneficiaries: beneficiariesSnap.size,
        activities: activitiesSnap.size,
        testimonies: testimoniesSnap.size,
        totalValue,
        totalCost,
      });

      const analysisInput = {
        programId: data.programId,
        programName: selectedProgram.title,
        startDate: data.startDate,
        endDate: data.endDate,
      };
      const result = await callAIOfflineFirst(
        () => runQualitativeAnalysis(analysisInput),
        () => offlineQualitativeAnalysis({ programName: selectedProgram.title, data: [] })
      );
      setAnalysisResult(result);
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Analysis Failed', description: e.message || 'The AI could not complete the analysis.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2"><Wand className="h-8 w-8" />Program Deep Dive</h1>
        <p className="text-muted-foreground">Program performance diagnostics based on submitted field data + AI qualitative insights.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Analysis Parameters</CardTitle><CardDescription>Select a program and date range to analyze.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-2">
                <Label htmlFor="programId">Program</Label>
                {isLoadingPrograms ? <Skeleton className="h-10 w-full" /> : (
                  <Controller name="programId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger id="programId"><SelectValue placeholder="Select a program..." /></SelectTrigger><SelectContent>{programs?.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select>
                  )} />
                )}
                {errors.programId && <p className="text-sm text-destructive">{errors.programId.message}</p>}
              </div>
              <div className="space-y-2"><Label htmlFor="startDate">Start Date</Label><Input id="startDate" type="date" {...register('startDate')} />{errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="endDate">End Date</Label><Input id="endDate" type="date" {...register('endDate')} />{errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}</div>
            </div>
            <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Analyze with AI</Button>
          </form>
        </CardContent>
      </Card>

      {snapshot && (
        <Card>
          <CardHeader><CardTitle>Program Data Snapshot</CardTitle><CardDescription>Automatically compiled from submitted records.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-lg border text-center"><Users className="h-5 w-5 mx-auto mb-2 text-primary" /><p className="text-2xl font-bold">{snapshot.beneficiaries}</p><p className="text-xs text-muted-foreground">Beneficiaries</p></div>
            <div className="p-4 rounded-lg border text-center"><BarChart3 className="h-5 w-5 mx-auto mb-2 text-primary" /><p className="text-2xl font-bold">{snapshot.activities}</p><p className="text-xs text-muted-foreground">Activities</p></div>
            <div className="p-4 rounded-lg border text-center"><Video className="h-5 w-5 mx-auto mb-2 text-primary" /><p className="text-2xl font-bold">{snapshot.testimonies}</p><p className="text-xs text-muted-foreground">Stories</p></div>
            <div className="p-4 rounded-lg border text-center"><p className="text-2xl font-bold">{Math.round(snapshot.totalCost).toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Cost</p></div>
            <div className="p-4 rounded-lg border text-center"><p className="text-2xl font-bold">{Math.round(snapshot.totalValue).toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Value</p></div>
          </CardContent>
        </Card>
      )}

      {isLoading && <Card><CardContent className="pt-6"><div className="flex flex-col items-center justify-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">AI is analyzing the data...</p></div></CardContent></Card>}

      {analysisResult && <AnalysisResultDisplay results={analysisResult} />}
    </div>
  );
}
