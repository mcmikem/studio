
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Rss, User, LogIn, LogOut, Clock, ListChecks, ArrowRight, BookOpen, Lightbulb, ChevronDown } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import type { Checkin, Checkout } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { formatDateSafe } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { tagColors } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

function CheckinCard({ checkin }: { checkin: Checkin }) {
    const { details } = checkin;
    return (
        <Card>
            <Collapsible>
                <CardHeader className="flex flex-row items-start gap-4">
                    <Avatar className="h-10 w-10 border" data-ai-hint="person avatar">
                         <AvatarFallback>{checkin.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <CardTitle>{checkin.name}'s Plan</CardTitle>
                        <CardDescription>{formatDateSafe(checkin.timestamp)}</CardDescription>
                        <p className="font-semibold text-sm mt-2">{checkin.primaryMission}</p>
                    </div>
                     <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-auto flex items-center gap-1">
                            Details <ChevronDown className="h-4 w-4" />
                        </Button>
                    </CollapsibleTrigger>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                        {details && (
                            <div className="space-y-3 pt-3 border-t">
                                {details.timeBlocks && details.timeBlocks.length > 0 && (
                                    <div>
                                        <h5 className="font-semibold text-xs text-muted-foreground uppercase flex items-center gap-2 mb-2"><Clock className="h-3 w-3" />Time Blocks</h5>
                                        <ul className="space-y-1 text-sm list-inside">
                                            {details.timeBlocks.map((block, i) => <li key={i}>{block.startTime}-{block.endTime}: {block.description}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {details.multiWinConnections && details.multiWinConnections.length > 0 && (
                                     <div>
                                        <h5 className="font-semibold text-xs text-muted-foreground uppercase flex items-center gap-2 mb-2"><ArrowRight className="h-3 w-3" />Multi-Win Connections</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {details.multiWinConnections.map((conn, i) => <Badge key={i} variant="outline">{conn}</Badge>)}
                                        </div>
                                    </div>
                                )}
                                 {details.teamSupport && details.teamSupport.length > 0 && (
                                     <div>
                                        <h5 className="font-semibold text-xs text-muted-foreground uppercase flex items-center gap-2 mb-2"><User className="h-3 w-3" />Team Support</h5>
                                        <p className="text-sm">Needs support from: {details.teamSupport.join(', ')}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}


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
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><ListChecks /> Mission Accomplishment</h4>
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

function CheckinStream() {
    const firestore = useFirestore();
    const [startOfDay, setStartOfDay] = useState<Timestamp | null>(null);

    useEffect(() => {
        // This effect runs only on the client after hydration
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        setStartOfDay(Timestamp.fromDate(now));
    }, []);

    const checkinsQuery = useMemoFirebase(() => {
        if (!firestore || !startOfDay) return null;
        return query(
            collection(firestore, 'checkins'), 
            where('timestamp', '>=', startOfDay), 
            orderBy('timestamp', 'desc')
        );
    }, [firestore, startOfDay]);

    const { data: checkins, isLoading } = useCollection<Checkin>(checkinsQuery);

    if (!startOfDay) {
        // Render skeletons or a placeholder while waiting for client-side mount
        return Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />);
    }

    return (
        <div className="space-y-6">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
            {checkins && checkins.length > 0 ? (
                checkins.map(checkin => <CheckinCard key={checkin.id} checkin={checkin} />)
            ) : (
                !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg border-2 border-dashed border-border text-center p-8">
                        <LogIn className="h-16 w-16 text-muted-foreground" />
                        <p className="mt-4 text-lg font-semibold">No Check-ins Yet Today</p>
                        <p className="mt-1 text-sm text-muted-foreground">Team members' daily plans will appear here once they check in.</p>
                    </div>
                )
            )}
        </div>
    );
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

export default function StreamPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <Rss className="h-8 w-8" />
          Team Stream
        </h1>
        <p className="text-muted-foreground">
          A chronological feed of all team check-ins and check-outs.
        </p>
      </header>

      <Tabs defaultValue="check-ins" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="check-ins">
            <LogIn className="mr-2 h-4 w-4" /> Today's Check-ins
          </TabsTrigger>
          <TabsTrigger value="check-outs">
            <LogOut className="mr-2 h-4 w-4" /> Checkout History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="check-ins">
            <CheckinStream />
        </TabsContent>
        <TabsContent value="check-outs">
            <CheckoutStream />
        </TabsContent>
      </Tabs>
    </div>
  );
}
