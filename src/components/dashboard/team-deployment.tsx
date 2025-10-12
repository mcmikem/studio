
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { User, Checkin } from '@/lib/types';
import { Users, CheckCircle, UserX, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parse, getMinutes, getHours, setHours, setMinutes, isBefore, isAfter, format } from 'date-fns';

type MemberStatus = 'Checked In' | 'Not Checked In';

const parseTime = (timeStr: string): Date => {
  // Handles "09:00 AM" format
  const now = new Date();
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (hours === 12) {
    hours = modifier.toUpperCase() === 'AM' ? 0 : 12;
  } else {
    hours = modifier.toUpperCase() === 'PM' ? hours + 12 : hours;
  }
  
  return setMinutes(setHours(now, hours), minutes);
};

export function TeamDeployment({ users, checkins }: { users: User[] | null; checkins: Checkin[] | null }) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const teamStatus = useMemo(() => {
        if (!users) return [];

        return users.map(user => {
            const userCheckin = checkins?.find(c => c.userId === user.id);

            let status: MemberStatus = 'Not Checked In';
            let currentTask = 'Not checked in today.';
            let nextTask = '';

            if (userCheckin) {
                status = 'Checked In';
                const now = currentTime;

                const scheduledTask = userCheckin.details.timeBlocks.find(block => {
                    try {
                        const start = parseTime(block.startTime);
                        const end = parseTime(block.endTime);
                        return isAfter(now, start) && isBefore(now, end);
                    } catch (e) {
                        return false; // Invalid time format
                    }
                });

                if (scheduledTask) {
                    currentTask = scheduledTask.description;
                } else {
                    currentTask = "Between tasks.";
                     const upcoming = userCheckin.details.timeBlocks.find(block => {
                        try {
                           return isAfter(parseTime(block.startTime), now);
                        } catch(e) { return false; }
                    });
                    if (upcoming) {
                        nextTask = `Next: ${upcoming.description} at ${upcoming.startTime}`;
                    }
                }
            }

            return {
                ...user,
                status,
                primaryMission: userCheckin?.primaryMission,
                currentTask,
                nextTask,
                details: userCheckin?.details
            };
        });
    }, [users, checkins, currentTime]);

    const statusConfig = {
        'Checked In': { icon: CheckCircle, color: 'text-green-500' },
        'Not Checked In': { icon: UserX, color: 'text-red-500' },
    };
    
    const isLoading = !users || !checkins;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> Team Deployment</CardTitle>
                <CardDescription>Live feed of your team's daily missions and current activities.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full space-y-3">
                    {isLoading && Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                    {teamStatus.map(member => {
                        const { icon: Icon, color } = statusConfig[member.status];
                        return (
                             <Card key={member.id} className={cn(member.status === 'Not Checked In' ? 'bg-red-500/5' : 'bg-muted/40')}>
                                <AccordionItem value={member.id} className="border-b-0">
                                    <AccordionTrigger className="p-4 hover:no-underline">
                                        <div className="flex items-center gap-3 w-full">
                                            <Icon className={cn("h-6 w-6 flex-shrink-0", color)} />
                                            <div className="flex-grow text-left">
                                                <p className="font-bold">{member.name}</p>
                                                <p className="text-sm text-muted-foreground truncate">{member.primaryMission || 'Not Checked In'}</p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                     <AccordionContent className="px-4 pb-4 space-y-3">
                                        <div className="p-3 bg-background/50 rounded-md">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Task</p>
                                            <p className="font-medium">{member.currentTask}</p>
                                            {member.nextTask && <p className="text-xs text-muted-foreground">{member.nextTask}</p>}
                                        </div>
                                        {member.details && (
                                            <div>
                                                <h4 className="font-semibold text-sm mb-1">Strategic Connections</h4>
                                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                    {member.details.multiWinConnections.map((conn, i) => <li key={i}>{conn}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            </Card>
                        )
                    })}
                </Accordion>
            </CardContent>
        </Card>
    );
}

