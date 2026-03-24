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
import { Rss, Check, X, Wind, Lightbulb } from 'lucide-react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Checkout } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { formatDateSafe, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


function CheckoutCard({ checkout }: { checkout: Checkout }) {
    
    const tasksArray = Array.isArray(checkout.tasks) ? checkout.tasks : [];
    const completedTasks = tasksArray.filter(t => t.status === 'Done');
    const notCompletedTasks = tasksArray.filter(t => t.status === 'Not Done');
    
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
             <CardHeader className="flex flex-row items-start gap-4 pb-3">
                <Avatar className="h-10 w-10 border" data-ai-hint="person avatar">
                     <AvatarImage src={checkout.avatar} />
                     <AvatarFallback>{getInitials(checkout.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <Link href={`/profile?userId=${checkout.userId}`} className="hover:underline">
                        <CardTitle className="text-base truncate">{checkout.name}'s Report</CardTitle>
                    </Link>
                    <CardDescription className="text-xs">{formatDateSafe(checkout.timestamp)}</CardDescription>
                </div>
             </CardHeader>
             <CardContent className="space-y-3 text-sm">
                {completedTasks.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Completed ({completedTasks.length})</p>
                        {completedTasks.map((t, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 bg-emerald-50 rounded-lg">
                                <Check className="h-4 w-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                                <p className="text-muted-foreground">{t.description}</p>
                            </div>
                        ))}
                    </div>
                )}
                 {notCompletedTasks.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Not Done ({notCompletedTasks.length})</p>
                        {notCompletedTasks.map((t, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 bg-rose-50 rounded-lg">
                                <X className="h-4 w-4 mt-0.5 text-rose-500 flex-shrink-0" />
                                <div>
                                    <p className="text-muted-foreground line-through">{t.description}</p>
                                    {t.reason && <p className="text-xs text-rose-400 mt-0.5 italic">{t.reason}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 {checkout.learning && (
                    <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                        <Lightbulb className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0"/>
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
            <div className="sm:hidden overflow-auto px-1 no-scrollbar" ref={parentRefMobile} style={{ maxHeight: 'calc(100vh - 220px)' }}>
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
                                        padding: '0 4px 16px 4px',
                                        boxSizing: 'border-box',
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

            {/* Desktop View - Card grid instead of compressed table */}
            <div className="hidden sm:block">
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="mb-4"><Skeleton className="h-48 w-full rounded-xl" /></div>
                ))}
                {checkouts && checkouts.length > 0 ? (
                    <div className="space-y-4" ref={parentRefDesktop} style={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
                        {checkouts.map((checkout) => (
                            <CheckoutCard key={checkout.id} checkout={checkout} />
                        ))}
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
