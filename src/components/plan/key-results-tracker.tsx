
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useUser, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, where, doc } from 'firebase/firestore';
import type { KeyResult } from '@/lib/types';
import { Target, Flag, AlertTriangle, Edit, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { isPast, parseISO, differenceInDays, isValid, startOfDay } from 'date-fns';
import { cn, formatDateSafe } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import Link from 'next/link';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useViewAs } from '@/hooks/use-view-as';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';


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

function EditKeyResultForm({ kr, onFinished }: { kr: KeyResult, onFinished: () => void }) {
    const [progress, setProgress] = useState(kr.currentProgress);
    const [isLoading, setIsLoading] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;

        setIsLoading(true);
        const krRef = doc(firestore, 'key-results', kr.id);
        try {
            await updateDocumentNonBlocking(krRef, { currentProgress: Number(progress) });
            toast({ title: "Progress Updated!", description: `${kr.title} has been updated.` });
            onFinished();
        } catch (error) {
            console.error("Failed to update KR:", error);
            toast({ variant: 'destructive', title: 'Update Failed' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="currentProgress">Current Progress</Label>
                <Input
                    id="currentProgress"
                    type="number"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    max={kr.target}
                    min="0"
                />
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Progress
                </Button>
            </DialogFooter>
        </form>
    );
}


export function KeyResultsTracker({ title, description, showAtRisk }: KeyResultsTrackerProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile(user);
  const { viewAsRole } = useViewAs();
  const [editingKr, setEditingKr] = useState<KeyResult | null>(null);

  const effectiveRole = viewAsRole || profile?.role;
  const managementRoles = ['Executive Director', 'Programs & Partnerships Manager', 'Operations & Field Manager', 'Administrator'];
  const canEdit = effectiveRole && managementRoles.includes(effectiveRole);
  
  const keyResultsQuery = useMemo(() => {
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
                <div key={kr.id} className="group p-4 rounded-lg -m-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <Link href={kr.link} className="flex-1">
                            <div className="space-y-2">
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
                                <Progress value={progressPercentage} className="h-2" />
                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                    <span>{formatProgress(kr)}</span>
                                    <span>Target: {formatTarget(kr)}</span>
                                </div>
                            </div>
                        </Link>
                        {canEdit && (
                             <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setEditingKr(kr)}>
                                <Edit className="h-4 w-4" />
                             </Button>
                        )}
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
                Go to the <Link href="/management/operational-plan" className="text-primary underline">Operational Plan</Link> page to set your new Key Results.
              </p>
            </div>
          )
        )}
      </CardContent>
      {editingKr && (
        <Dialog open={!!editingKr} onOpenChange={(open) => !open && setEditingKr(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Progress: {editingKr.title}</DialogTitle>
                    <DialogDescription>
                        Set the new current progress for this Key Result. Target is {formatTarget(editingKr)}.
                    </DialogDescription>
                </DialogHeader>
                <EditKeyResultForm kr={editingKr} onFinished={() => setEditingKr(null)} />
            </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
