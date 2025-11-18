
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
import type { User, Checkin } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { isWithinInterval, parse, startOfDay, format, isValid } from 'date-fns';
import { EmptyState } from '../ui/empty-state';

type TeamStatus = {
  user: User;
  checkedIn: boolean;
  currentTask: string | null;
  checkinTime: string | null;
};

const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2).toUpperCase();
};

interface TeamDeploymentProps {
    users: User[] | null;
    checkins: Checkin[] | null;
    isLoading: boolean;
}

export function TeamDeployment({ users, checkins, isLoading }: TeamDeploymentProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Set current time only on the client-side after mount.
  useEffect(() => {
    // This effect ensures this component only computes state on the client
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const teamStatus = useMemo(() => {
    // Guard against running this logic before data is loaded or on the server.
    if (!users || !checkins || !currentTime) {
      return null;
    }
    
    // De-duplicate users based on ID to prevent rendering issues from bad data.
    const uniqueUsers = Array.from(new Map(users.map(user => [user.id, user])).values());
    const checkinMap = new Map(checkins.map(c => [c.userId, c]));
    
    return uniqueUsers.map(user => {
      const userCheckin = checkinMap.get(user.id);
      let currentTask: string | null = null;
      let checkinTime: string | null = null;
      
      if (userCheckin) {
        checkinTime = format(userCheckin.timestamp.toDate(), 'p');
        if (userCheckin.details?.timeBlocks) {
          for (const block of userCheckin.details.timeBlocks) {
            try {
              const now = currentTime;
              const baseDate = startOfDay(now);
              const startTime = parse(block.startTime, 'hh:mm a', baseDate);
              const endTime = parse(block.endTime, 'hh:mm a', baseDate);
              
              if (!isValid(startTime) || !isValid(endTime)) {
                console.error("Invalid time format in time block:", block);
                continue; // Skip this block if time is invalid
              }
              
              if (isWithinInterval(now, { start: startTime, end: endTime })) {
                currentTask = block.description;
                break;
              }
            } catch (e) {
              console.error("Error parsing time block:", block, e);
            }
          }
        }
      }
      
      return {
        user,
        checkedIn: !!userCheckin,
        currentTask: currentTask,
        checkinTime: checkinTime,
      };
    });
  }, [users, checkins, currentTime]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users /> Team Deployment</CardTitle>
        <CardDescription>
          A real-time view of who has checked in and what they are working on.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !teamStatus ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : teamStatus.length > 0 ? (
           <Accordion type="single" collapsible className="w-full">
            {teamStatus.map(status => {
                if (!status.user?.id) return null; // Added safe-guard
                return (
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
                            {status.checkedIn ? `Checked in at ${status.checkinTime}` : 'Not Checked In'}
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
                )
            })}
           </Accordion>
        ) : (
            <EmptyState
                icon={Users}
                title="No Staff Found"
                description="Could not load team member information."
                className="min-h-0"
             />
        )}
      </CardContent>
    </Card>
  );
}
