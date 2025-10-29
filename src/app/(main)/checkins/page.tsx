
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { LogIn, Calendar, Clock, Target as TargetIcon, Link as LinkIcon, BrainCircuit, Check, X } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Checkin } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { formatDateSafe } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EmptyState } from '@/components/ui/empty-state';

function CheckinCard({ checkin }: { checkin: Checkin }) {
    return (
        <Card>
             <CardHeader className="flex flex-row items-start gap-4">
                <Avatar className="h-10 w-10 border" data-ai-hint="person avatar">
                     {/* Checkin doesn't have avatar, so we use fallback */}
                     <AvatarFallback>{checkin.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{checkin.name}'s Daily Plan</CardTitle>
                    <CardDescription>{formatDateSafe(checkin.timestamp)}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted border">
                    <h3 className="font-semibold flex items-center gap-2"><TargetIcon className="h-5 w-5 text-primary" /> Today's Primary Mission</h3>
                    <p className="text-muted-foreground mt-1">{checkin.primaryMission}</p>
                </div>

                <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Strategic Connections</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {checkin.details.multiWinConnections.map((connection, index) => (
                            <li key={index}>{connection}</li>
                        ))}
                    </ul>
                </div>
                
                <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><BrainCircuit className="h-4 w-4" /> AI Best Practice Tip</h4>
                     <p className="text-sm text-muted-foreground italic">"{checkin.details.bestPractice}"</p>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>View Detailed Time Blocks</AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-2">
                            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                {checkin.details.timeBlocks.map((block, index) => (
                                    <li key={index}><strong>{block.startTime} - {block.endTime}:</strong> {block.description}</li>
                                ))}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    )
}

function CheckinStream() {
    const firestore = useFirestore();
     const checkinsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'checkins'), orderBy('timestamp', 'desc'));
    }, [firestore]);

    const { data: checkins, isLoading } = useCollection<Checkin>(checkinsQuery);

    return (
        <div className="space-y-6">
            {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-60 w-full" />)}
            {checkins && checkins.length > 0 ? (
                checkins.map(checkin => <CheckinCard key={checkin.id} checkin={checkin} />)
            ) : (
                 !isLoading && (
                    <EmptyState
                        icon={LogIn}
                        title="No Check-ins Found"
                        description="Team members' daily plans will appear here once they use the AI Daily Planner."
                        className="min-h-[400px]"
                    />
                )
            )}
        </div>
    );
}


function CheckinsPageContent() {
    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                <LogIn className="h-8 w-8" />
                Daily Check-in Stream
                </h1>
                <p className="text-muted-foreground">
                A live feed of the team's daily plans and priorities.
                </p>
            </header>
            <CheckinStream />
        </div>
    );
}

export default function CheckinsPage() {
    return (
        <Suspense>
            <CheckinsPageContent />
        </Suspense>
    )
}
