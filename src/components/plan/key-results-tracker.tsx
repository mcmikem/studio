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
import type { KeyResult, Activity, ImpactMetric, Partnership } from '@/lib/types';
import { Target, Flag, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { isPast, parseISO, differenceInDays, isValid, startOfDay, subDays } from 'date-fns';
import { cn, formatDateSafe } from '@/lib/utils';
import { useMemo } from 'react';
import { ProgressRing } from '../ui/progress-ring';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import Link from 'next/link';

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

  const { data: keyResults, isLoading: isLoadingKR } = useCollection<KeyResult>(keyResultsQuery);
  
  const isLoading = isLoadingKR;

  const processedKeyResults = useMemo(() => {
    if (!keyResults) return [];

    return keyResults.map(kr => {
      let link = '/plan'; // Default link
      if (kr.title?.includes('KR3')) link = '/management/partnerships';
      
      return { ...kr, link };
    });
  }, [keyResults]);

  const atRiskKr = useMemo(() => {
    if (!processedKeyResults) return null;
    const today = startOfDay(new Date());
    
    return processedKeyResults.map(kr => {
        let deadline = new Date();
        try {
          if (kr.deadline && typeof kr.deadline === 'string') {
            deadline = parseISO(kr.deadline);
          } else if (kr.deadline) {
            deadline = new Date(kr.deadline);
          }
          if(!isValid(deadline)) return {...kr, alertStatus: 'on-track'};
        } catch(e) {
          return {...kr, alertStatus: 'on-track'};
        }

        const daysRemaining = differenceInDays(deadline, today);
        const progressPercent = kr.target > 0 ? (kr.currentProgress / kr.target) * 100 : 0;

        let status: 'on-track' | 'at-risk' | 'critical' = 'on-track';

        if (progressPercent < 100) {
            if (daysRemaining < 0) {
                status = 'critical'; // Past deadline
            } else if (daysRemaining < 7) {
                status = 'at-risk'; // Nearing deadline
            }
        }
        
        return {...kr, alertStatus: status};
    }).filter(kr => kr.alertStatus !== 'on-track');

  }, [processedKeyResults]);


  const formatTarget = (kr: KeyResult) => {
    if (kr.title?.includes('KR1')) return `${kr.target}%`; // Backlog is a %
    if (kr.title?.includes('KR2')) return `${kr.target} Units`;
    if (kr.title?.includes('KR3')) return `${kr.target} MOUs`;
    if (kr.title?.includes('KR4')) return `${kr.target}%`;
    return kr.target.toLocaleString();
  }

  const formatProgress = (kr: KeyResult) => {
    if (kr.title?.includes('KR1')) return `${kr.currentProgress}%`;
    if (kr.title?.includes('KR2')) return `${kr.currentProgress} Units`;
    if (kr.title?.includes('KR3')) return `${kr.currentProgress} MOUs`;
    if (kr.title?.includes('KR4')) return `${kr.currentProgress}%`;
    return kr.currentProgress.toLocaleString();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Success Dashboard: Key Results"}</CardTitle>
        <CardDescription>
          {description || "Live progress against the operational plan's Key Results."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
         {showAtRisk && atRiskKr && atRiskKr.length > 0 && (
            <Alert variant={atRiskKr.some(k => k.alertStatus === 'critical') ? 'destructive' : 'default'} className={cn(
                !atRiskKr.some(k => k.alertStatus === 'critical') && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
            )}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-bold">
                    {atRiskKr.some(k => k.alertStatus === 'critical') ? "Critical Alert" : "Attention Needed"}
                </AlertTitle>
                <AlertDescription>
                    {atRiskKr[0].alertStatus === 'critical' 
                        ? `${atRiskKr[0].title} is past its deadline and is not yet complete.` 
                        : `${atRiskKr[0].title} is nearing its deadline. Action may be required.`
                    }
                    {atRiskKr.length > 1 && ` (+${atRiskKr.length - 1} more)`}
                </AlertDescription>
            </Alert>
        )}
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
            </div>
          ))}
        {processedKeyResults && processedKeyResults.length > 0 ? (
          processedKeyResults.map((kr) => {
             const progressPercentage = kr.target > 0 ? (kr.currentProgress / kr.target) * 100 : 0;
             let deadlineDate;
             try {
                deadlineDate = kr.deadline ? parseISO(kr.deadline) : new Date();
             } catch(e) {
                deadlineDate = new Date();
             }
             const isDeadlinePast = isValid(deadlineDate) ? isPast(deadlineDate) && progressPercentage < 100 : false;
             
            return (
                <Link href={kr.link} key={kr.id} className="block p-4 rounded-lg -m-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <ProgressRing progress={progressPercentage} size={60} strokeWidth={6} />
                        <div className="flex-1 space-y-1">
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
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>{formatProgress(kr)}</span>
                                <span>Target: {formatTarget(kr)}</span>
                            </div>
                        </div>
                    </div>
                </Link>
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
                Go to the <Link href="/management/operational-plan" className="text-primary underline">Operational Plan</Link> page to set your new Key Results.
              </p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
