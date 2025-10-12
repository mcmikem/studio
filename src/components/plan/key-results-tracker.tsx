
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
import { isPast, parseISO, differenceInDays } from 'date-fns';
import { cn, formatDateSafe } from '@/lib/utils';
import { useMemo } from 'react';
import { ProgressRing } from '../ui/progress-ring';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const priorityColors: { [key: string]: string } = {
    High: "border-red-500 bg-red-500/10 text-red-500",
    Medium: "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    Low: "border-blue-500 bg-blue-500/10 text-blue-500",
};

interface KeyResultsTrackerProps {
    title?: string;
    description?: string;
}


export function KeyResultsTracker({ title, description }: KeyResultsTrackerProps) {
  const firestore = useFirestore();
  
  const keyResultsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'key-results'), orderBy('title'));
  }, [firestore]);

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'activities'));
  }, [firestore]);

  const metricsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'impact-metrics'));
  }, [firestore]);
  
  const partnershipsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'partnerships'));
  }, [firestore]);


  const { data: keyResults, isLoading: isLoadingKR } = useCollection<KeyResult>(keyResultsQuery);
  const { data: activities, isLoading: isLoadingActivities } = useCollection<Activity>(activitiesQuery);
  const { data: metrics, isLoading: isLoadingMetrics } = useCollection<ImpactMetric>(metricsQuery);
  const { data: partnerships, isLoading: isLoadingPartnerships } = useCollection<Partnership>(partnershipsQuery);


  const processedKeyResults = useMemo(() => {
    if (!keyResults || !activities || !metrics || !partnerships) return null;

    const cycleOfDignityMetric = metrics.find(m => m.metric === 'Cycle of Dignity Fundraising');

    return keyResults.map(kr => {
      let liveProgress = kr.currentProgress;

      // KR1: Fundraising Growth
      if (kr.title === 'OCT-KR1' && cycleOfDignityMetric) {
        liveProgress = cycleOfDignityMetric.current;
      }
      
      // KR2: Tree Planting
      if (kr.title === 'OCT-KR2') {
        liveProgress = activities.reduce((sum, act) => {
            return sum + (act.trees_planted || 0);
        }, 0);
      }

      // KR3: RED Campaign
      if (kr.title === 'OCT-KR3') {
        liveProgress = activities.reduce((sum, act) => {
            return sum + (act.parents_attended || 0) + (act.teachers_attended || 0);
        }, 0);
      }
      
      // KR4: New Partnerships
      if (kr.title === 'OCT-KR4') {
        liveProgress = partnerships.filter(p => {
            if (!p.createdAt) return false;
            const creationDate = p.createdAt.toDate();
            // Assuming the plan is for October 2025
            return creationDate.getFullYear() === 2025 && creationDate.getMonth() === 9; // 9 is October (0-indexed)
        }).length;
      }
      
      // KR5-KR8: These are based on percentage completion or manual milestones.
      // The `currentProgress` from the database will be used directly.
      // Future logic for checklist-based progress would go here.
      // if (kr.title === 'OCT-KR5') { /* ... complex checklist logic ... */ }
      // if (kr.title === 'OCT-KR6') { /* ... document upload logic ... */ }

      return { ...kr, currentProgress: liveProgress };
    })

  }, [keyResults, activities, metrics, partnerships]);

  const atRiskKr = useMemo(() => {
    if (!processedKeyResults) return null;
    const today = new Date();
    
    // Logic from Blueprint:
    // BEHIND SCHEDULE ALERT: IF (Current Date > (Start Date + (Total Days * 0.7))) AND Progress % < 70 THEN "🟡 [KR Name] behind schedule"
    // CRITICAL ALERT: IF (Days remaining < 7) AND (Progress % < (Days passed/Total Days * 100)) THEN "🔴 [KR Name] needs immediate attention"
    
    return processedKeyResults.map(kr => {
        const startDate = new Date('2025-10-01');
        const deadline = parseISO(kr.deadline);
        const totalDays = differenceInDays(deadline, startDate);
        const daysPassed = differenceInDays(today, startDate);
        const daysRemaining = differenceInDays(deadline, today);
        const progressPercent = kr.target > 0 ? (kr.currentProgress / kr.target) * 100 : 0;

        let status: 'on-track' | 'at-risk' | 'critical' = 'on-track';

        if (progressPercent < 100) {
           const requiredPace = (daysPassed / totalDays) * 100;
            if (daysRemaining < 7 && progressPercent < requiredPace) {
                status = 'critical';
            } else if (daysPassed / totalDays > 0.7 && progressPercent < 70) {
                status = 'at-risk';
            }
        }
        
        return {...kr, alertStatus: status};
    }).filter(kr => kr.alertStatus !== 'on-track');

  }, [processedKeyResults]);


  const formatTarget = (kr: KeyResult) => {
    if (kr.title === 'OCT-KR1') return `${(kr.target / 1000000).toFixed(1)}M UGX`;
    if (kr.target === 100 && (kr.title === 'OCT-KR5' || kr.title === 'OCT-KR6' || kr.title === 'OCT-KR7')) return `${kr.target}%`;
    return kr.target.toLocaleString();
  }

  const formatProgress = (kr: KeyResult) => {
    if (kr.title === 'OCT-KR1') return `${(kr.currentProgress / 1000000).toFixed(1)}M`;
    if (kr.target === 100 && (kr.title === 'OCT-KR5' || kr.title === 'OCT-KR6' || kr.title === 'OCT-KR7')) return `${kr.currentProgress}%`;
    return kr.currentProgress.toLocaleString();
  }
  
  const isLoading = isLoadingKR || isLoadingActivities || isLoadingMetrics || isLoadingPartnerships;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Success Dashboard: Key Results"}</CardTitle>
        <CardDescription>
          {description || "Live progress against the October Operational Plan's Key Results."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
         {atRiskKr && atRiskKr.length > 0 && (
            <Alert variant={atRiskKr.some(k => k.alertStatus === 'critical') ? 'destructive' : 'default'} className={cn(
                !atRiskKr.some(k => k.alertStatus === 'critical') && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
            )}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-bold">
                    {atRiskKr.some(k => k.alertStatus === 'critical') ? "Critical Alert" : "Attention Needed"}
                </AlertTitle>
                <AlertDescription>
                    {atRiskKr[0].alertStatus === 'critical' 
                        ? `${atRiskKr[0].title} is critically behind schedule and requires immediate action.` 
                        : `${atRiskKr[0].title} is behind schedule. Consider reallocating resources.`
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
             const deadlineDate = parseISO(kr.deadline);
             const isDeadlinePast = isPast(deadlineDate) && progressPercentage < 100;
             
            return (
                <div key={kr.id} className="flex items-center gap-4">
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
