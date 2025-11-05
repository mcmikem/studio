
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Rss, LogOut, BookOpen, Lightbulb, Check, X, Wind } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Checkout } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { formatDateSafe } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function CheckoutCard({ checkout }: { checkout: Checkout }) {
    
    // The 'tasks' field might be an array or a single string for older documents.
    // This provides backward compatibility.
    const tasksArray = Array.isArray(checkout.tasks) 
        ? checkout.tasks 
        : ((typeof (checkout as any).task === 'string' && (checkout as any).task) ? [{ description: (checkout as any).task, status: 'Done'}] : []);

    const completedTasks = tasksArray.filter(t => t.status === 'Done');
    const notCompletedTasks = tasksArray.filter(t => t.status === 'Not Done');

    return (
        <Card>
             <CardHeader className="flex flex-row items-start gap-4">
                <Avatar className="h-10 w-10 border" data-ai-hint="person avatar">
                     <AvatarImage src={checkout.avatar} />
                     <AvatarFallback>{checkout.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{checkout.name}'s Report</CardTitle>
                    <CardDescription>{formatDateSafe(checkout.timestamp)}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">Task Completion</h4>
                  <div className="space-y-3">
                    {completedTasks.map((task, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <Check className="h-4 w-4 mt-1 text-green-500 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                    ))}
                    {notCompletedTasks.map((task, index) => (
                         <div key={index} className="flex items-start gap-3">
                            <X className="h-4 w-4 mt-1 text-red-500 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-muted-foreground line-through">{task.description}</p>
                                {task.reason && <p className="text-xs text-red-500 italic pl-2">Reason: {task.reason}</p>}
                            </div>
                        </div>
                    ))}
                     {tasksArray.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No specific tasks were reported.</p>
                    )}
                  </div>
                </div>

                {(checkout.learning || checkout.tomorrowPlan) && <Separator />}

                 {checkout.learning && (
                    <div>
                         <h4 className="font-semibold mb-1 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-yellow-500"/> Key Learning</h4>
                        <p className="text-muted-foreground text-sm italic">"{checkout.learning}"</p>
                    </div>
                )}
                
                {checkout.tomorrowPlan && (
                    <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2"><BookOpen className="h-4 w-4 text-blue-500"/> Tomorrow's Priority</h4>
                        <p className="text-muted-foreground text-sm">{checkout.tomorrowPlan}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function CheckoutStream() {
    const firestore = useFirestore();
     const checkoutsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'checkouts'), orderBy('timestamp', 'desc'));
    }, [firestore]);

    const { data: checkouts, isLoading } = useCollection<Checkout>(checkoutsQuery);

    return (
        <div className="space-y-6">
            {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-60 w-full" />)}
            {checkouts && checkouts.length > 0 ? (
                checkouts.map(checkout => <CheckoutCard key={checkout.id} checkout={checkout} />)
            ) : (
                 !isLoading && (
                    <EmptyState
                        icon={Wind}
                        title="Quiet day so far..."
                        description="No one has checked out yet. Be the first to share your progress!"
                        className="min-h-[400px]"
                    >
                         <Button asChild className="mt-4"><Link href="/forms/check-out">Check Out Now</Link></Button>
                    </EmptyState>
                )
            )}
        </div>
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
