
'use client';

import { useState, useRef, useMemo, Suspense } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { LogIn, Clock, Target as TargetIcon, Link as LinkIcon, BrainCircuit, Loader2 } from 'lucide-react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Checkin } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateSafe, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const moodIcons: { [key: string]: string } = {
  good: '😊',
  neutral: '😐',
  bad: '😔',
};

type StrategicAlignment = {
  krTitle: string;
  alignmentJustification: string;
};

type TimeBlock = {
    startTime: string;
    endTime: string;
    description: string;
}

function CheckinCard({ checkin }: { checkin: Checkin }) {
    const hasDetails = !!checkin.details;

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden">
             <CardHeader className="flex flex-row items-start gap-4 pb-4">
                <Avatar className="h-10 w-10 border" data-ai-hint="person avatar">
                     <AvatarFallback>{getInitials(checkin.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <Link href={`/profile?userId=${checkin.userId}`} className="hover:underline truncate">
                            <CardTitle className="text-base sm:text-lg truncate">{checkin.name}'s Plan</CardTitle>
                        </Link>
                        {checkin.mood && (
                            <span title={`Feeling: ${checkin.mood}`} className="text-xl flex-shrink-0">{moodIcons[checkin.mood]}</span>
                        )}
                    </div>
                    <CardDescription className="text-xs sm:text-sm">{formatDateSafe(checkin.timestamp)}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 sm:p-4 rounded-lg bg-muted border">
                    <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base"><TargetIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> Today's Mission</h3>
                    <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">{checkin.primaryMission}</p>
                </div>

                {hasDetails && (
                  <div className="space-y-4">
                    {/* Time Blocks - ALWAYS visible on all screens as an accordion */}
                    {checkin.details?.timeBlocks && (
                       <Accordion type="single" collapsible className="w-full">
                           <AccordionItem value="time-blocks" className="border-b-0">
                               <AccordionTrigger className="py-2 hover:no-underline rounded-md hover:bg-muted/50 px-2 transition-colors">
                                  <span className="font-semibold text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Time Blocks</span>
                               </AccordionTrigger>
                               <AccordionContent className="space-y-2 pt-2 px-2">
                                   <ul className="list-none space-y-2 text-sm text-muted-foreground">
                                       {checkin.details.timeBlocks.map((block: TimeBlock, index: number) => (
                                           <li key={index} className="flex flex-col sm:flex-row gap-1 sm:gap-4 p-2 bg-muted/30 rounded-md">
                                             <strong className="text-primary w-28 shrink-0">{block.startTime} - {block.endTime}:</strong> 
                                             <span>{block.description}</span>
                                           </li>
                                       ))}
                                   </ul>
                               </AccordionContent>
                           </AccordionItem>
                       </Accordion>
                    )}

                    {/* Strategic Alignments */}
                    {checkin.details?.strategicAlignments && checkin.details.strategicAlignments.length > 0 && (
                      <div className="space-y-2 px-2">
                          <h4 className="font-semibold text-sm flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Strategic Alignments</h4>
                          <div className="space-y-2">
                              {checkin.details.strategicAlignments.map((align: StrategicAlignment, index: number) => (
                                  <div key={index} className="text-xs sm:text-sm p-2 bg-muted/50 rounded-md">
                                      <p className="font-bold">{align.krTitle}</p>
                                      <p className="text-muted-foreground mt-0.5">{align.alignmentJustification}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                    )}
                    
                    {/* Best Practice Tip */}
                    {checkin.details?.bestPractice && (
                      <div className="space-y-2 px-2">
                          <h4 className="font-semibold text-sm flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-omuto-yellow" /> Best Practice Tip</h4>
                          <p className="text-sm text-muted-foreground italic p-2 bg-omuto-yellow/10 rounded-md border border-omuto-yellow/20">"{checkin.details.bestPractice}"</p>
                      </div>
                    )}
                  </div>
                )}
            </CardContent>
        </Card>
    )
}


function CheckinStream() {
    const [limitCount, setLimitCount] = useState(100);
    const parentRef = useRef<HTMLDivElement>(null);
    
    const checkinsQuery = useMemoFirebase((db) => {
        return query(collection(db, 'checkins'), orderBy('timestamp', 'desc'), limit(limitCount));
    }, [limitCount]);

    const { data: checkinsData, isLoading } = useCollection<Checkin>(checkinsQuery);
    const checkins = checkinsData || [];

    const virtualizer = useVirtualizer({
        count: checkins.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 400, // Checkin cards are taller than activity cards
        overscan: 3,
    });

    return (
        <div className="flex flex-col h-[calc(100vh-200px)]">
            <div 
                ref={parentRef}
                className="flex-1 overflow-auto px-1 pb-6"
            >
                {isLoading && checkins.length === 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[400px] w-full rounded-xl" />)}
                    </div>
                ) : checkins.length > 0 ? (
                    <div
                        style={{
                            height: `${virtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {virtualizer.getVirtualItems().map((virtualItem) => {
                            const checkin = checkins[virtualItem.index];
                            return (
                                <div
                                    key={virtualItem.key}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${virtualItem.start}px)`,
                                        paddingBottom: '24px' // Gap replacement
                                    }}
                                >
                                    <CheckinCard checkin={checkin} />
                                </div>
                            );
                        })}
                    </div>
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

                {checkins.length >= limitCount && (
                    <div className="flex justify-center mt-8 pb-6">
                        <Button 
                            variant="outline" 
                            size="lg"
                            onClick={() => setLimitCount((prev: number) => prev + 50)} 
                            disabled={isLoading}
                            className="w-full sm:w-auto"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Load More Check-ins
                        </Button>
                    </div>
                )}
            </div>
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
