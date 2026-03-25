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
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { TreeSurvivalSurvey } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Leaf } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateSafe } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function GreenSchoolsDataPage() {
  const firestore = useFirestore();
  const surveysQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tree-surveys'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);

  const { data: surveys, isLoading } = useCollection<TreeSurvivalSurvey>(surveysQuery);

  const conditionColors: { [key: string]: string } = {
    "Good": "border-green-500 bg-green-500/10 text-green-500",
    "Fair": "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    "Poor": "border-red-500 bg-red-500/10 text-red-500",
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2">
          <Leaf className="h-8 w-8" />
          GreenSchools Data
        </h1>
        <p className="text-muted-foreground">
          Analyze data from tree survival surveys and other program activities.
        </p>
      </header>
      <Card>
         <CardHeader>
            <CardTitle>Tree Survival Surveys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="sm:hidden space-y-4">
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
              ))}
              {surveys && surveys.length > 0 ? (
                surveys.map((survey) => (
                  <Card key={survey.id}>
                    <CardHeader className="py-4">
                        <CardTitle className="text-base flex items-center justify-between">
                            {formatDateSafe(survey.surveyDate, 'dateOnly')}
                            <Badge variant="outline" className={conditionColors[survey.conditionOfTrees]}>
                                {survey.conditionOfTrees}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 text-sm text-muted-foreground">
                        <p>Logged by: {survey.userName}</p>
                        <p>Trees Survived: <strong className="text-omuto-navy">{survey.numberOfTreesSurvived}</strong></p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                !isLoading && <EmptyState icon={Leaf} title="No Survey Data" description="Submit a tree survival survey from the MEAL Hub to see data here." />
              )}
            </div>

            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Survey Date</TableHead>
                    <TableHead className="hidden md:table-cell">Logged By</TableHead>
                    <TableHead>Trees Survived</TableHead>
                    <TableHead>Condition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      </TableRow>
                    ))}
                  {surveys && surveys.length > 0 ? (
                    surveys.map((survey) => (
                      <TableRow key={survey.id}>
                        <TableCell>{formatDateSafe(survey.surveyDate, 'dateOnly')}</TableCell>
                        <TableCell className="hidden md:table-cell">{survey.userName}</TableCell>
                        <TableCell>{survey.numberOfTreesSurvived}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className={conditionColors[survey.conditionOfTrees]}>
                                {survey.conditionOfTrees}
                            </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    !isLoading && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-48">
                          <EmptyState
                            icon={Leaf}
                            title="No Survey Data"
                            description="Submit a tree survival survey from the MEAL Hub to see data here."
                          />
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
