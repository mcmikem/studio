
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
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const moodIcons: { [key: string]: string } = {
  energized: '⚡️',
  focused: '🎯',
  calm: '🧘‍♀️',
  overwhelmed: '🥵',
};

const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2).toUpperCase();
};

function CheckinCard({ checkin }: { checkin: Checkin }) {
    const hasDetails = !!checkin.details;

    return (
        <Card>
             <CardHeader className="flex flex-row items-start gap-4">
                <Avatar className="h-10 w-10 border" data-ai-hint="person avatar">
                     {/* Checkin doesn't have avatar, so we use fallback */}
                     <AvatarFallback>{getInitials(checkin.name)}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="flex items-center gap-2">
                        <Link href={`/profile?userId=${checkin.userId}`} className="hover:underline">
                            <CardTitle>{checkin.name}'s Daily Plan</CardTitle>
                        </Link>
                        {checkin.mood && (
                            <span title={`Feeling: ${checkin.mood}`} className="text-xl">{moodIcons[checkin.mood]}</span>
                        )}
                    </div>
                    <CardDescription>{formatDateSafe(checkin.timestamp)}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted border">
                    <h3 className="font-semibold flex items-center gap-2"><TargetIcon className="h-5 w-5 text-primary" /> Today's Primary Mission</h3>
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{checkin.primaryMission}</p>
                </div>

                {hasDetails && (
                  <>
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
                  </>
                )}
            </CardContent>
        </Card>
    )
}

function CheckinStream() {
     const checkinsQuery = useMemoFirebase((db) => {
        return query(collection(db, 'checkins'), orderBy('timestamp', 'desc'));
    }, []);

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
                        title="No Check-ins Yet!"
                        description="Be the first to create a daily plan with the AI Daily Planner."
                        className="min-h-[400px]"
                    >
                        <Button asChild className="mt-4"><Link href="/daily-plan">Plan Your Day</Link></Button>
                    </EmptyState>
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
