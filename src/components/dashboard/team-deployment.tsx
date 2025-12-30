
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { User, Checkin } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Target, Clock, AlertTriangle } from 'lucide-react';
import { isWithinInterval, parse, startOfDay, format, isValid } from 'date-fns';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle } from '@/components/ui/alert';

type TeamStatus = {
  user: User;
  checkedIn: boolean;
  currentTask: string | null;
  primaryMission: string | null;
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
  const [selectedUserStatus, setSelectedUserStatus] = useState<TeamStatus | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); 
    return () => clearInterval(timer);
  }, []);

  const teamStatus = useMemo(() => {
    if (!users || !checkins || !currentTime) {
      return null;
    }
    
    const uniqueUsers = Array.from(new Map(users.map(user => [user.id, user])).values());
    const checkinMap = new Map(checkins.map(c => [c.userId, c]));
    
    return uniqueUsers.map(user => {
      const userCheckin = checkinMap.get(user.id);
      let currentTask: string | null = null;
      let checkinTime: string | null = null;
      let primaryMission: string | null = null;
      
      if (userCheckin) {
        checkinTime = userCheckin.timestamp ? format(userCheckin.timestamp.toDate(), 'p') : null;
        primaryMission = userCheckin.primaryMission;
        
        if (userCheckin.details && Array.isArray(userCheckin.details.timeBlocks)) {
          for (const block of userCheckin.details.timeBlocks) {
            // **CRITICAL FIX**: Add robust guards to prevent parsing invalid data.
            if (block && typeof block.startTime === 'string' && typeof block.endTime === 'string' && block.startTime.includes(':') && block.endTime.includes(':')) {
              try {
                const now = currentTime;
                const baseDate = startOfDay(now);

                const startTime = parse(block.startTime, 'hh:mm a', baseDate);
                const endTime = parse(block.endTime, 'hh:mm a', baseDate);
        
                 if (!isValid(startTime) || !isValid(endTime)) {
                    console.error("Invalid time format in time block:", block);
                    continue;
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
      }
      
      return { user, checkedIn: !!userCheckin, currentTask, primaryMission, checkinTime };
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
        {(isLoading || !teamStatus) ? (
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-12 rounded-full" />)}
          </div>
        ) : teamStatus.length > 0 ? (
           <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 gap-4">
            {teamStatus.map((status, index) => {
                return (
                    <button key={status.user?.id || index} onClick={() => setSelectedUserStatus(status)} className="flex flex-col items-center gap-1 text-center group">
                        <div className="relative">
                            <Avatar className="h-12 w-12 border-2 group-hover:border-primary transition-colors" data-ai-hint="person avatar">
                                <AvatarImage src={status.user.photoURL} />
                                <AvatarFallback>{getInitials(status.user.name)}</AvatarFallback>
                            </Avatar>
                            <span className={cn(
                                "absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-background",
                                status.checkedIn ? 'bg-green-500' : 'bg-gray-400'
                            )} />
                        </div>
                        <p className="text-xs font-medium truncate w-full group-hover:text-primary">{status.user.name.split(' ')[0]}</p>
                    </button>
                )
            })}
           </div>
        ) : (
            <EmptyState
                icon={Users}
                title="No Staff Found"
                description="Could not load team member information."
                className="min-h-0"
             />
        )}
      </CardContent>

      <Dialog open={!!selectedUserStatus} onOpenChange={() => setSelectedUserStatus(null)}>
        <DialogContent>
            {selectedUserStatus && (
                 <>
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border" data-ai-hint="person avatar">
                                <AvatarImage src={selectedUserStatus.user.photoURL} />
                                <AvatarFallback>{getInitials(selectedUserStatus.user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <DialogTitle>{selectedUserStatus.user.name}</DialogTitle>
                                <DialogDescription>{selectedUserStatus.user.role}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedUserStatus.checkedIn ? (
                            <>
                                 <Alert>
                                    <AlertTitle className="font-semibold flex items-center justify-between">
                                        Checked In
                                        <Badge variant="secondary">{selectedUserStatus.checkinTime}</Badge>
                                    </AlertTitle>
                                </Alert>
                                <div className="p-4 bg-muted rounded-lg">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                        <Target /> Primary Mission Today
                                    </div>
                                    <p className="mt-1">{selectedUserStatus.primaryMission}</p>
                                </div>
                                 <div className="p-4 bg-muted rounded-lg">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                                        <Clock /> Current Focus
                                    </div>
                                    <p className="mt-1">{selectedUserStatus.currentTask || "Not in a scheduled time block."}</p>
                                </div>
                            </>
                        ) : (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
                                <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500" />
                                <p className="mt-2 font-semibold">Not Checked In</p>
                                <p className="text-sm text-muted-foreground">{selectedUserStatus.user.name} has not submitted their daily plan yet.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
