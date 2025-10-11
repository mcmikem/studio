
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import type { KeyResult } from '@/lib/types';
import { Target, Flag, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { isPast, parseISO } from 'date-fns';
import { cn, formatDateSafe } from '@/lib/utils';
import { useMemo } from 'react';

const priorityColors: { [key: string]: string } = {
    High: "border-red-500 bg-red-500/10 text-red-500",
    Medium: "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    Low: "border-blue-500 bg-blue-500/10 text-blue-500",
};

interface KeyResultsTrackerProps {
    title?: string;
    description?: string;
    showAtRisk?: boolean;
}


export function KeyResultsTracker({ title, description, showAtRisk }: KeyResultsTrackerProps) {
  const firestore = useFirestore();
  const keyResultsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'key-results'), orderBy('title'));
  }, [firestore]);

  const { data: keyResults, isLoading } = useCollection<KeyResult>(keyResultsQuery);

  const atRiskKr = useMemo(() => {
    if (!keyResults) return null;
    // Find the KR with the lowest progress that isn't complete yet
    return keyResults
        .filter(kr => kr.currentProgress / kr.target < 1)
        .sort((a,b) => (a.currentProgress / a.target) - (b.currentProgress / b.target))[0];
  }, [keyResults]);


  const formatTarget = (kr: KeyResult) => {
    if (kr.target === 100 && kr.currentProgress <= 100) return `${kr.target}%`;
    if (kr.target >= 1000) return `${(kr.target / 1000000).toFixed(1)}M UGX`;
    return kr.target.toLocaleString();
  }

  const formatProgress = (kr: KeyResult) => {
    if (kr.target === 100 && kr.currentProgress <= 100) return `${kr.currentProgress}%`;
    if (kr.target >= 1000) return `${(kr.currentProgress / 1000000).toFixed(1)}M`;
     return kr.currentProgress.toLocaleString();
  }
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Success Dashboard: Key Results"}</CardTitle>
        <CardDescription>
          {description || "Live progress against the October Operational Plan's Key Results."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
         {showAtRisk && atRiskKr && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-red-600">AT RISK: {atRiskKr.title}</p>
                    <p className="text-sm text-muted-foreground">{atRiskKr.description} is behind schedule. Consider reallocating resources.</p>
                </div>
            </div>
        )}
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
            </div>
          ))}
        {keyResults && keyResults.length > 0 ? (
          keyResults.map((kr) => {
             const progressPercentage = kr.target > 0 ? (kr.currentProgress / kr.target) * 100 : 0;
             const deadlineDate = parseISO(kr.deadline);
             const isDeadlinePast = isPast(deadlineDate) && progressPercentage < 100;
             
            return (
                <div key={kr.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold">{kr.title}: {kr.description}</p>
                            <p className={cn("text-xs text-muted-foreground", isDeadlinePast && "text-destructive")}>
                                <Flag className="inline h-3 w-3 mr-1" />
                                Deadline: {formatDateSafe(kr.deadline, "dateOnly")}
                            </p>
                        </div>
                        <Badge variant="outline" className={priorityColors[kr.priority]}>{kr.priority}</Badge>
                    </div>
                    <Progress value={progressPercentage} className="h-3" />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{formatProgress(kr)}</span>
                        <span>Target: {formatTarget(kr)}</span>
                    </div>
                </div>
            )
          })
        ) : (
          !isLoading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] rounded-lg border-2 border-dashed border-border bg-card text-center p-8">
              <Target className="h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">
                No Key Results Found
              </h2>
              <p className="mt-2 max-w-md text-muted-foreground">
                Key Results for the operational plan have not been loaded yet.
              </p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
