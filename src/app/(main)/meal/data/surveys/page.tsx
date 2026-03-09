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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { BaselineSurvey, EndlineSurvey } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

type CombinedSurvey = (BaselineSurvey | EndlineSurvey) & { type: 'Baseline' | 'Endline' };

export default function SurveysPage() {
  const firestore = useFirestore();
  
  const baselineQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'baseline-surveys'), orderBy('surveyDate', 'desc'));
  }, [firestore]);

  const endlineQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'endline-surveys'), orderBy('surveyDate', 'desc'));
  }, [firestore]);

  const { data: baselineSurveys, isLoading: isLoadingBaseline } = useCollection<BaselineSurvey>(baselineQuery);
  const { data: endlineSurveys, isLoading: isLoadingEndline } = useCollection<EndlineSurvey>(endlineQuery);
  
  const isLoading = isLoadingBaseline || isLoadingEndline;

  const combinedSurveys = useMemo(() => {
    const combined: CombinedSurvey[] = [];
    if (baselineSurveys) {
      combined.push(...baselineSurveys.map(s => ({ ...s, type: 'Baseline' as const })));
    }
    if (endlineSurveys) {
      combined.push(...endlineSurveys.map(s => ({ ...s, type: 'Endline' as const })));
    }
    return combined.sort((a, b) => b.surveyDate.localeCompare(a.surveyDate));
  }, [baselineSurveys, endlineSurveys]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Beneficiary Surveys
        </h1>
        <p className="text-muted-foreground">
          View all submitted baseline and endline survey data.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
        {/* Mobile View */}
        <div className="sm:hidden space-y-4">
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
             <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
          {combinedSurveys.length > 0 ? (
            combinedSurveys.map((survey) => (
              <Card key={survey.id}>
                <CardHeader className="py-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xs font-mono">{survey.beneficiaryId}</CardTitle>
                    <Badge variant={survey.type === 'Baseline' ? 'secondary' : 'default'}>
                      {survey.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4 text-sm flex justify-between items-center">
                   <span className="text-muted-foreground">{formatDateSafe(survey.surveyDate, 'dateOnly')}</span>
                   <span className="font-bold">Skill: {survey.skillLevel}/10</span>
                </CardContent>
              </Card>
            ))
          ) : (
            !isLoading && <EmptyState icon={FileText} title="No Surveys" description="No data found." />
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Beneficiary ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Survey Date</TableHead>
                <TableHead>Skill Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  </TableRow>
                ))}
              {combinedSurveys.length > 0 ? (
                combinedSurveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell className="font-mono text-xs">{survey.beneficiaryId}</TableCell>
                    <TableCell>
                      <Badge variant={survey.type === 'Baseline' ? 'secondary' : 'default'}>
                        {survey.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateSafe(survey.surveyDate, 'dateOnly')}</TableCell>
                    <TableCell>{survey.skillLevel}/10</TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-48"
                    >
                      <EmptyState
                        icon={FileText}
                        title="No Surveys Submitted"
                        description="Data from baseline and endline surveys will appear here."
                      />
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
