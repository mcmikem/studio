
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Rss, LogOut, BookOpen, Lightbulb } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Checkout } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { formatDateSafe } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { tagColors } from '@/lib/data';
import { Separator } from '@/components/ui/separator';

function CheckoutCard({ checkout }: { checkout: Checkout }) {
    const tags = checkout.task?.match(/#\w+/g) || [];

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
                    <p className="text-muted-foreground text-sm">{checkout.task}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {tags.map(tag => <Badge key={tag} variant="outline" className={tagColors[tag as keyof typeof tagColors] || tagColors['#Update']}>{tag}</Badge>)}
                </div>
            </CardContent>
            {(checkout.learning || checkout.tomorrowPlan) && (
                <>
                <Separator />
                <CardFooter className="flex-col items-start gap-4 text-sm pt-6">
                    {checkout.learning && (
                        <div>
                             <h4 className="font-semibold mb-1 flex items-center gap-2"><Lightbulb /> Key Learning</h4>
                            <p className="text-muted-foreground">{checkout.learning}</p>
                        </div>
                    )}
                    {checkout.tomorrowPlan && (
                        <div>
                            <h4 className="font-semibold mb-1 flex items-center gap-2"><BookOpen /> Tomorrow's Priority</h4>
                            <p className="text-muted-foreground">{checkout.tomorrowPlan}</p>
                        </div>
                    )}
                </CardFooter>
                </>
            )}
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
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg border-2 border-dashed border-border text-center p-8">
                        <LogOut className="h-16 w-16 text-muted-foreground" />
                        <p className="mt-4 text-lg font-semibold">No Check-outs Found</p>
                        <p className="mt-1 text-sm text-muted-foreground">Team members' end-of-day reports will appear here.</p>
                    </div>
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
                Team Stream
                </h1>
                <p className="text-muted-foreground">
                A chronological feed of all team check-outs.
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
