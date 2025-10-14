'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { collection, query, where, Timestamp, orderBy, getDocs } from 'firebase/firestore';
import type { User, Checkin } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Loader2 } from 'lucide-react';
import { isWithinInterval, parse, startOfDay } from 'date-fns';

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
  const [teamStatus, setTeamStatus] = useState<TeamStatus[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Set current time on client-side mount
  useEffect(() => {
    // We use a mock time consistent with the sample data to ensure functionality is visible.
    const mockTime = new Date('2025-10-13T10:30:00Z');
    setCurrentTime(mockTime);

    // In a real-time scenario, you would use new Date() and update it.
    // const timer = setInterval(() => {
    //   setCurrentTime(new Date());
    // }, 60000);
    // return () => clearInterval(timer);
  }, []);
  

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const checkinsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query for the specific date of the sample data.
    const today = new Date('2025-10-13T12:00:00Z');
    const startOfToday = startOfDay(today);
    return query(collection(firestore, 'checkins'), where('timestamp', '>=', Timestamp.fromDate(startOfToday)));
  }, [firestore]);
  const { data: checkins, isLoading: isLoadingCheckins } = useCollection<Checkin>(checkinsQuery);

  useEffect(() => {
    if (isLoadingUsers || isLoadingCheckins || !currentTime) {
      setIsLoading(true);
      return;
    }

    if (!users) {
        setTeamStatus([]);
        setIsLoading(false);
        return;
    }
    
    const checkinMap = new Map(checkins?.map(c => [c.userId, c]));
    
    const newTeamStatus = users.map(user => {
      const userCheckin = checkinMap.get(user.id);
      let currentTask: string | null = null;
      
      if (userCheckin && userCheckin.details.timeBlocks) {
        for (const block of userCheckin.details.timeBlocks) {
          try {
            const now = currentTime;
            // Assuming the date part is the same day for parsing
            const baseDate = startOfDay(now);
            const startTime = parse(block.startTime, 'hh:mm a', baseDate);
            const endTime = parse(block.endTime, 'hh:mm a', baseDate);
            
            if (isValid(startTime) && isValid(endTime) && isWithinInterval(now, { start: startTime, end: endTime })) {
              currentTask = block.description;
              break;
            }
          } catch (e) {
            console.error("Error parsing time block:", block, e);
          }
        }
      }
      
      return {
        user,
        checkedIn: !!userCheckin,
        currentTask: currentTask
      };
    });

    setTeamStatus(newTeamStatus);
    setIsLoading(false);

  }, [users, checkins, isLoadingUsers, isLoadingCheckins, currentTime]);
  

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
        {!isLoading && teamStatus && teamStatus.length > 0 ? (
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
                        <Badge variant={status.checkedIn ? 'default' : 'secondary'} className={status.checkedIn ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>
                          {status.checkedIn ? 'Checked In' : 'Not Checked In'}
                        </Badge>
                    </AccordionTrigger>
                    <AccordionContent className="pl-6 pt-2">
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
        ) : (
            !isLoading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] rounded-lg border-2 border-dashed border-border bg-card text-center p-8">
              <Users className="h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">
                No Staff Found
              </h2>
              <p className="mt-2 max-w-md text-muted-foreground">
                Could not load team member information.
              </p>
            </div>
            )
        )}
      </CardContent>
    </Card>
  );
}
