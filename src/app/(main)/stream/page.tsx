'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Rss, LogOut, BookOpen, Lightbulb, Check, X, Wind } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Checkout } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { formatDateSafe, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function CheckoutCard({ checkout }: { checkout: Checkout }) {
    
    const tasksArray = Array.isArray(checkout.tasks) ? checkout.tasks : [];
    const completedTasks = tasksArray.filter(t => t.status === 'Done');
    const notCompletedTasks = tasksArray.filter(t => t.status === 'Not Done');
    
    return (
        <Card>
             <CardHeader className="flex flex-row items-start gap-4 pb-4">
                <Avatar className="h-10 w-10 border" data-ai-hint="person avatar">
                     <AvatarImage src={checkout.avatar} />
                     <AvatarFallback>{getInitials(checkout.name)}</AvatarFallback>
                </Avatar>
                <div>
                    <Link href={`/profile?userId=${checkout.userId}`} className="hover:underline">
                        <CardTitle className="text-base">{checkout.name}'s Report</CardTitle>
                    </Link>
                    <CardDescription className="text-xs">{formatDateSafe(checkout.timestamp)}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                {completedTasks.length > 0 && (
                    <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                        <p className="text-muted-foreground">{completedTasks.map(t => t.description).join(', ')}</p>
                    </div>
                )}
                 {notCompletedTasks.length > 0 && (
                    <div className="flex items-start gap-2">
                        <X className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                        <p className="text-muted-foreground line-through">{notCompletedTasks.map(t => t.description).join(', ')}</p>
                    </div>
                )}
                 {checkout.learning && (
                    <div className="flex items-start gap-2 pt-2 border-t">
                        <Lightbulb className="h-4 w-4 mt-0.5 text-yellow-500 flex-shrink-0"/>
                        <p className="text-muted-foreground italic">"{checkout.learning}"</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function CheckoutStream() {
     const checkoutsQuery = useMemoFirebase((db) => {
        return query(collection(db, 'checkouts'), orderBy('timestamp', 'desc'), limit(50));
    }, []);

    const { data: checkouts, isLoading } = useCollection<Checkout>(checkoutsQuery);

    const parentRefMobile = useRef<HTMLDivElement>(null);
    const parentRefDesktop = useRef<HTMLDivElement>(null);

    const virtualizerMobile = useVirtualizer({
        count: checkouts?.length || 0,
        getScrollElement: () => parentRefMobile.current,
        estimateSize: () => 180, // Approximate height of a Checkout card
        overscan: 5,
    });

    const virtualizerDesktop = useVirtualizer({
        count: checkouts?.length || 0,
        getScrollElement: () => parentRefDesktop.current,
        estimateSize: () => 73, // Approximate height of a table row
        overscan: 5,
    });

    return (
        <>
            {/* Mobile View */}
            <div className="sm:hidden h-[600px] overflow-auto px-1 no-scrollbar" ref={parentRefMobile}>
                {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 w-full mb-4" />)}
                {checkouts && checkouts.length > 0 ? (
                    <div
                        style={{
                            height: `${virtualizerMobile.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {virtualizerMobile.getVirtualItems().map((virtualItem) => {
                            const checkout = checkouts[virtualItem.index];
                            return (
                                <div
                                    key={virtualItem.key}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${virtualItem.start}px)`,
                                        paddingBottom: '16px'
                                    }}
                                >
                                    <CheckoutCard checkout={checkout} />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    !isLoading && (
                        <EmptyState
                            icon={Wind}
                            title="Quiet day so far..."
                            description="No one has checked out yet. Be the first to share your progress!"
                            className="py-12"
                        >
                            <Button asChild className="mt-4"><Link href="/forms/check-out">Check Out Now</Link></Button>
                        </EmptyState>
                    )
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block">
                <div className="border border-omuto-navy/10 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="grid grid-cols-[200px,1fr,150px] gap-4 px-6 py-4 bg-muted/40 border-b border-omuto-navy/10 font-bold uppercase text-[10px] tracking-widest text-omuto-navy/60">
                        <div>User</div>
                        <div>Summary</div>
                        <div className="text-right">Date</div>
                    </div>
                    <div className="h-[600px] overflow-auto no-scrollbar" ref={parentRefDesktop}>
                        {isLoading && Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-[200px,1fr,150px] gap-4 px-6 py-4 border-b border-omuto-navy/5 last:border-0 items-center">
                                <Skeleton className="h-10 w-32" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-24 ml-auto" />
                            </div>
                        ))}
                        {checkouts && checkouts.length > 0 ? (
                            <div
                                style={{
                                    height: `${virtualizerDesktop.getTotalSize()}px`,
                                    width: '100%',
                                    position: 'relative',
                                }}
                            >
                                {virtualizerDesktop.getVirtualItems().map((virtualItem) => {
                                    const checkout = checkouts[virtualItem.index];
                                    const tasksArray = Array.isArray(checkout.tasks) ? checkout.tasks : [];
                                    const completed = tasksArray.filter(t => t.status === 'Done').length;
                                    const notCompleted = tasksArray.filter(t => t.status === 'Not Done').length;
                                    
                                    return (
                                        <div
                                            key={virtualItem.key}
                                            className="grid grid-cols-[200px,1fr,150px] gap-4 px-6 py-4 border-b border-omuto-navy/5 last:border-0 items-center hover:bg-muted/5 transition-colors"
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: `${virtualItem.size}px`,
                                                transform: `translateY(${virtualItem.start}px)`,
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border" data-ai-hint="person avatar">
                                                    <AvatarImage src={checkout.avatar} />
                                                    <AvatarFallback>{getInitials(checkout.name)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-bold text-sm text-omuto-navy">{checkout.name}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{tasksArray[0]?.description || 'End of day report'}</p>
                                                <div className="text-[10px] text-muted-foreground flex gap-2 font-bold uppercase tracking-tighter">
                                                    {completed > 0 && <span className="text-green-600">{completed} COMPLETED</span>}
                                                    {notCompleted > 0 && <span className="text-red-500">{notCompleted} REMAINING</span>}
                                                    {checkout.learning && <span className="text-yellow-600">| LEARNING LOGGED</span>}
                                                </div>
                                            </div>
                                            <div className="text-right text-[11px] text-muted-foreground">{formatDateSafe(checkout.timestamp)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            !isLoading && (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Wind className="h-10 w-10 text-muted-foreground/30 mb-2" />
                                    <p className="text-muted-foreground font-bold">Quiet day so far...</p>
                                    <Button asChild className="mt-4" variant="outline" size="sm">
                                        <Link href="/forms/check-out">Check Out Now</Link>
                                    </Button>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function StreamPageContent() {
    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                <Rss className="h-8 w-8" />
                Team Stream (Check-outs)
                </h1>
                <p className="text-muted-foreground">
                A chronological feed of all team end-of-day reports, learnings, and plans.
                </p>
            </header>
            <CheckoutStream />
        </div>
    );
}

export default function StreamPage() {
    return (
        <Suspense>
            <StreamPageContent />
        </Suspense>
    )
}
