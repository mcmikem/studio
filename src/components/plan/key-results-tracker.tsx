'use client';

import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import type { KeyResult } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Goal, ArrowRight } from 'lucide-react';
import { formatDateSafe } from '@/lib/utils';
import { isPast, format, isSameMonth } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

function PriorityBadge({ priority }: { priority: string }) {
    return (
        <Badge className={cn(
            'text-[9px] sm:text-[10px] font-black uppercase tracking-widest border',
            priority === 'High' && 'border-omuto-red/30 bg-omuto-red/10 text-omuto-red',
            priority === 'Medium' && 'border-omuto-yellow/30 bg-omuto-yellow/10 text-omuto-yellow',
            priority === 'Low' && 'border-green-500/30 bg-green-500/10 text-green-600'
        )}>
            {priority}
        </Badge>
    );
}

export function KeyResultsTracker() {
    const firestore = useFirestore();
    const now = new Date();

    const keyResultsQuery = useMemoFirebase((db) => {
        if (!db) return null;
        return query(collection(db, 'key-results'), orderBy('deadline', 'asc'));
    }, [firestore]);

    const { data: allKeyResults, isLoading } = useCollection<KeyResult>(keyResultsQuery);

    const keyResults = React.useMemo(() => {
        if (!allKeyResults) return [];
        return allKeyResults
            .filter(kr => {
                const deadline = kr.deadline instanceof Timestamp ? kr.deadline.toDate() : new Date(kr.deadline);
                return isSameMonth(deadline, now);
            })
            .sort((a, b) => {
                const pOrder = (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3);
                if (pOrder !== 0) return pOrder;
                const aDate = a.deadline instanceof Timestamp ? a.deadline.toDate() : new Date(a.deadline);
                const bDate = b.deadline instanceof Timestamp ? b.deadline.toDate() : new Date(b.deadline);
                return aDate.getTime() - bDate.getTime();
            });
    }, [allKeyResults, now]);

    const formatTarget = (kr: KeyResult) => {
        if (kr.description?.toLowerCase().includes('ugx') || kr.description?.toLowerCase().includes('shilling') || kr.description?.toLowerCase().includes('kes')) {
            const val = Number(kr.target) || 0;
            if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M UGX`;
            if (val >= 1000) return `${(val / 1000).toFixed(0)}K UGX`;
            return `${val.toLocaleString()} UGX`;
        }
        if (kr.target === 100) return `${kr.target}%`;
        return `${kr.target.toLocaleString()} ${kr.unit || ''}`.trim();
    };

    const highCount = keyResults.filter(k => k.priority === 'High').length;
    const mediumCount = keyResults.filter(k => k.priority === 'Medium').length;
    const lowCount = keyResults.filter(k => k.priority === 'Low').length;

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <CardTitle>{format(now, 'MMMM yyyy')} Operational Plan</CardTitle>
                        <CardDescription>
                            {keyResults.length > 0
                                ? `${keyResults.length} priorities — ${highCount} High, ${mediumCount} Medium, ${lowCount} Low`
                                : 'Track and update progress on your monthly strategic objectives.'}
                        </CardDescription>
                    </div>
                    <Button asChild variant="secondary" className="flex-shrink-0">
                        <Link href="/management/operational-plan">
                            {keyResults.length > 0 ? 'Update Plan' : 'Set Up Plan'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {keyResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {keyResults.map((kr, index) => {
                            const progress = kr.target > 0 ? Math.min(100, Math.round((kr.currentProgress / kr.target) * 100)) : 0;
                            const deadlineDate = kr.deadline instanceof Timestamp ? kr.deadline.toDate() : new Date(kr.deadline);
                            const deadlinePast = isPast(deadlineDate) && progress < 100;

                            return (
                                <Card key={kr.id} className="flex flex-col justify-between border border-muted hover:border-primary/20 transition-colors">
                                    <CardHeader className="pb-2 sm:pb-3">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-black text-muted-foreground">{index + 1}.</span>
                                                <PriorityBadge priority={kr.priority} />
                                            </div>
                                            <ProgressRing progress={progress} size={36} strokeWidth={3} />
                                        </div>
                                        <CardTitle className="text-[13px] sm:text-[14px] leading-tight font-bold text-omuto-navy line-clamp-2">
                                            {kr.title}
                                        </CardTitle>
                                        <CardDescription className="text-[10px] sm:text-[11px] leading-relaxed line-clamp-2">
                                            {kr.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0 space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-1.5 sm:p-2 bg-muted/50 rounded-md">
                                                <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest truncate">Target</p>
                                                <p className="text-[11px] sm:text-xs font-bold text-omuto-navy truncate">{formatTarget(kr)}</p>
                                            </div>
                                            <div className="p-1.5 sm:p-2 bg-muted/50 rounded-md">
                                                <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest truncate">Deadline</p>
                                                <p className={cn(
                                                    "text-[11px] sm:text-xs font-bold truncate",
                                                    deadlinePast ? 'text-destructive' : 'text-omuto-navy'
                                                )}>
                                                    {formatDateSafe(kr.deadline, 'dateOnly')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    progress >= 100 ? 'bg-green-500' : deadlinePast ? 'bg-destructive' : 'bg-primary'
                                                )}
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center p-8 bg-muted rounded-lg">
                        <div className="mx-auto h-12 w-12 text-muted-foreground"><Goal /></div>
                        <h3 className="mt-4 text-lg font-semibold">The {format(now, 'MMMM yyyy')} Plan is Not Set</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Upload this month&apos;s operational plan to activate the tracker.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/management/operational-plan">
                                Go to Plan Updater
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
