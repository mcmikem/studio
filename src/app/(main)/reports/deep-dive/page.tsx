
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, subDays } from 'date-fns';
import type { Program, QualitativeAnalysisOutput } from '@/lib/types';
import { runQualitativeAnalysis } from '@/ai/actions';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Wand, Loader2, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

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
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600"><CheckCircle className="h-5 w-5" /> Recurring Successes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-2 text-sm">
                            {results.recurringSuccesses.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-600"><AlertTriangle className="h-5 w-5" /> Common Challenges</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-2 text-sm">
                            {results.commonChallenges.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-600"><Lightbulb className="h-5 w-5" /> Key Learnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-2 text-sm">
                            {results.keyLearnings.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </CardContent>
    </Card>
  )
}

export default function ProgramDeepDivePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<QualitativeAnalysisOutput | null>(null);
  const { toast } = useToast();

  const firestore = useFirestore();
  const programsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'programs'), orderBy('title')) : null, [firestore]);
  const { data: programs, isLoading: isLoadingPrograms } = useCollection<Program>(programsQuery);

  const { register, handleSubmit, control, formState: { errors } } = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
        startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    }
  });

  const onSubmit = async (data: AnalysisFormData) => {
    setIsLoading(true);
    setAnalysisResult(null);

    const selectedProgram = programs?.find(p => p.id === data.programId);
    if (!selectedProgram) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected program not found.' });
        setIsLoading(false);
        return;
    }

    try {
        const result = await runQualitativeAnalysis({
            programId: data.programId,
            programName: selectedProgram.title,
            startDate: data.startDate,
            endDate: data.endDate,
        });
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
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Wand className="h-8 w-8" />
          Program Deep Dive
        </h1>
        <p className="text-muted-foreground">
          Use AI to analyze qualitative data from activity reports to find key themes and insights.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Analysis Parameters</CardTitle>
          <CardDescription>Select a program and date range to analyze.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-2">
                <Label htmlFor="programId">Program</Label>
                {isLoadingPrograms ? <Skeleton className="h-10 w-full" /> : (
                  <Controller
                    name="programId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="programId"><SelectValue placeholder="Select a program..." /></SelectTrigger>
                        <SelectContent>
                          {programs?.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
                {errors.programId && <p className="text-sm text-destructive">{errors.programId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
                 {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
                 {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
              </div>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze with AI
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {isLoading && (
         <Card>
            <CardContent className="pt-6">
                 <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">AI is analyzing the data...</p>
                </div>
            </CardContent>
        </Card>
      )}

      {analysisResult && <AnalysisResultDisplay results={analysisResult} />}
    </div>
  );
}
