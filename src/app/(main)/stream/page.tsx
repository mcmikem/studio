
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

    return (
        <>
            {/* Mobile View */}
            <div className="space-y-4 sm:hidden">
                {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
                {checkouts && checkouts.length > 0 ? (
                    checkouts.map(checkout => <CheckoutCard key={checkout.id} checkout={checkout} />)
                ) : (
                    !isLoading && (
                        <EmptyState
                            icon={Wind}
                            title="Quiet day so far..."
                            description="No one has checked out yet. Be the first to share your progress!"
                        >
                            <Button asChild className="mt-4"><Link href="/forms/check-out">Check Out Now</Link></Button>
                        </EmptyState>
                    )
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block">
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">User</TableHead>
                                <TableHead>Summary</TableHead>
                                <TableHead className="w-[150px] text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                </TableRow>
                            ))}
                            {checkouts && checkouts.length > 0 ? (
                                checkouts.map((checkout) => {
                                    const tasksArray = Array.isArray(checkout.tasks) ? checkout.tasks : [];
                                    const completed = tasksArray.filter(t => t.status === 'Done').length;
                                    const notCompleted = tasksArray.filter(t => t.status === 'Not Done').length;
                                    return (
                                        <TableRow key={checkout.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border" data-ai-hint="person avatar">
                                                        <AvatarImage src={checkout.avatar} />
                                                        <AvatarFallback>{getInitials(checkout.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{checkout.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium truncate">{tasksArray[0]?.description}</p>
                                                <div className="text-xs text-muted-foreground space-x-2">
                                                    {completed > 0 && <span className="text-green-600">{completed} done</span>}
                                                    {notCompleted > 0 && <span className="text-red-600">{notCompleted} not done</span>}
                                                    {checkout.learning && <span>| Key Learning</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-xs">{formatDateSafe(checkout.timestamp)}</TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                !isLoading && (
                                     <TableRow>
                                        <TableCell colSpan={3} className="h-48">
                                            <EmptyState
                                                icon={Wind}
                                                title="Quiet day so far..."
                                                description="No one has checked out yet. Check-out reports will appear here."
                                                className="min-h-0"
                                            >
                                                 <Button asChild className="mt-4" variant="outline"><Link href="/forms/check-out">Check Out Now</Link></Button>
                                            </EmptyState>
                                        </TableCell>
                                     </TableRow>
                                )
                            )}
                        </TableBody>
                    </Table>
                </Card>
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
