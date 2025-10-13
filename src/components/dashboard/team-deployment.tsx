
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { User, Checkin } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import { parse, isWithinInterval, set } from 'date-fns';

interface TeamDeploymentProps {
  users: User[] | null;
  checkins: Checkin[] | null;
}

const parseTimeString = (timeStr: string, date: Date) => {
    try {
        const parsedTime = parse(timeStr, 'hh:mm a', date);
        return parsedTime;
    } catch (e) {
        return null;
    }
};

export function TeamDeployment({ users, checkins }: TeamDeploymentProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set time on mount and update every minute to ensure it runs only on client
    setCurrentTime(new Date());
    const timerId = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timerId);
  }, []);

  const teamStatus = useMemo(() => {
    if (!users || !checkins || !currentTime) return null;

    return users.map(user => {
      const userCheckin = checkins.find(c => c.userId === user.id);

      if (!userCheckin) {
        return {
          ...user,
          status: 'Not Checked In',
          currentActivity: 'N/A',
          schedule: [],
        };
      }

      const today = new Date();
      let currentActivity = 'Between tasks';
      
      for (const block of userCheckin.details.timeBlocks) {
        const start = parseTimeString(block.startTime, today);
        const end = parseTimeString(block.endTime, today);

        if (start && end && isWithinInterval(currentTime, { start, end })) {
          currentActivity = block.description;
          break;
        }
      }

      return {
        ...user,
        status: 'Checked In',
        currentActivity,
        schedule: userCheckin.details.timeBlocks,
        primaryMission: userCheckin.primaryMission,
      };
    });
  }, [users, checkins, currentTime]);

  const checkedInCount = useMemo(() => {
      return teamStatus?.filter(u => u.status === 'Checked In').length || 0;
  }, [teamStatus]);

  if (!teamStatus) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-24 w-full" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
            <span>Team Deployment</span>
            <Badge variant="outline">{checkedInCount} / {users?.length || 0} Active</Badge>
        </CardTitle>
        <CardDescription>
          A live look at what the team is focused on right now based on their daily plans.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
            {teamStatus.map(member => (
                <AccordionItem value={member.id} key={member.id}>
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 w-full">
                            <Avatar className="h-9 w-9 border">
                                <AvatarImage src={member.photoURL} />
                                <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                                <p className="font-semibold">{member.name}</p>
                                <div className="flex items-center gap-2">
                                    {member.status === 'Checked In' 
                                        ? <CheckCircle className="h-4 w-4 text-green-500" />
                                        : <XCircle className="h-4 w-4 text-muted-foreground" />
                                    }
                                    <p className="text-sm text-muted-foreground truncate">{member.currentActivity}</p>
                                </div>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                       {member.status === 'Checked In' && member.schedule.length > 0 ? (
                            <>
                                <p className="font-semibold text-primary">Mission: {member.primaryMission}</p>
                                <ul className="list-disc list-inside space-y-2 text-xs">
                                {member.schedule.map((item, index) => (
                                    <li key={index}><strong>{item.startTime} - {item.endTime}:</strong> {item.description}</li>
                                ))}
                                </ul>
                            </>
                       ) : (
                           <p className="text-sm text-muted-foreground text-center py-4">Not checked in for today.</p>
                       )}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
