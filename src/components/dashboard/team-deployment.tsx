'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import type { User, Checkin } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { parse, isWithinInterval, set } from 'date-fns';

type TeamStatus = {
  user: User;
  checkedIn: boolean;
  currentTask: string | null;
};

const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2).toUpperCase();
};

export function TeamDeployment() {
  const firestore = useFirestore();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Set current time on the client after hydration
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const checkinsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const today = new Date('2025-10-13T12:00:00Z');
    today.setHours(0, 0, 0, 0);
    const startOfToday = Timestamp.fromDate(today);
    return query(collection(firestore, 'checkins'), where('timestamp', '>=', startOfToday));
  }, [firestore]);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);

  const teamStatus = useMemo((): TeamStatus[] | null => {
    if (isLoadingUsers || isLoadingCheckins || !users || !currentTime) {
      return null;
    }
    
    // Create a map for quick check-in lookup
    const checkinMap = new Map(checkins?.map(c => [c.userId, c]));

    return users.map(user => {
      const userCheckin = checkinMap.get(user.id);
      let currentTask: string | null = null;
      
      if (userCheckin && userCheckin.details.timeBlocks) {
        for (const block of userCheckin.details.timeBlocks) {
          try {
            const now = currentTime;
            // Parse time strings like "09:00 AM" into Date objects for today
            const startTime = parse(block.startTime, 'hh:mm a', now);
            const endTime = parse(block.endTime, 'hh:mm a', now);

            if (isWithinInterval(now, { start: startTime, end: endTime })) {
              currentTask = block.description;
              break;
            }
          } catch (e) {
            console.error("Error parsing time block:", block, e);
            // Ignore invalid time blocks
          }
        }
      }
      
      return {
        user,
        checkedIn: !!userCheckin,
        currentTask: currentTask
      };
    });

  }, [users, checkins, currentTime, isLoadingUsers, isLoadingCheckins]);
  
  const isLoading = !teamStatus;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users /> Team Deployment</CardTitle>
        <CardDescription>
          A real-time view of who has checked in and what they are working on.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {!isLoading && teamStatus && (
           <Accordion type="single" collapsible className="w-full">
            {teamStatus.map(status => (
                 <AccordionItem value={status.user.id} key={status.user.id}>
                    <AccordionTrigger>
                        <div className="flex items-center gap-4 flex-1">
                            <Avatar className="h-9 w-9 border" data-ai-hint="person avatar">
                                <AvatarImage src={status.user.photoURL} />
                                <AvatarFallback>{getInitials(status.user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                                <p className="font-semibold">{status.user.name}</p>
                                <p className="text-xs text-muted-foreground">{status.user.role}</p>
                            </div>
                        </div>
                        <Badge variant={status.checkedIn ? 'default' : 'outline'} className={status.checkedIn ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>
                          {status.checkedIn ? 'Checked In' : 'Not Checked In'}
                        </Badge>
                    </AccordionTrigger>
                    <AccordionContent className="pl-6">
                       {status.checkedIn ? (
                            status.currentTask ? (
                                <div>
                                    <p className="text-xs text-muted-foreground font-semibold">CURRENTLY:</p>
                                    <p>{status.currentTask}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No task scheduled for the current time.</p>
                            )
                       ) : (
                           <p className="text-sm text-muted-foreground italic">Waiting for user to check in.</p>
                       )}
                    </AccordionContent>
                </AccordionItem>
            ))}
           </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
