
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Clock } from 'lucide-react';
import type { Checkin } from '@/lib/types';
import { isWithinInterval, parse, startOfDay, differenceInMilliseconds } from 'date-fns';
import { Skeleton } from '../ui/skeleton';

interface TodaysFocusProps {
  checkin: Checkin | null;
  isLoading: boolean;
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 0) return "00:00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function TodaysFocus({ checkin, isLoading }: TodaysFocusProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { currentTask, timeRemaining } = useMemo(() => {
    if (!checkin?.details.timeBlocks) {
      return { currentTask: null, timeRemaining: 0 };
    }

    const now = currentTime;
    const baseDate = startOfDay(now);

    for (const block of checkin.details.timeBlocks) {
      try {
        const startTime = parse(block.startTime, 'hh:mm a', baseDate);
        const endTime = parse(block.endTime, 'hh:mm a', baseDate);

        if (isWithinInterval(now, { start: startTime, end: endTime })) {
          const remaining = differenceInMilliseconds(endTime, now);
          return { currentTask: block.description, timeRemaining: remaining };
        }
      } catch (e) {
        console.error("Error parsing time block for focus card:", block, e);
      }
    }

    return { currentTask: null, timeRemaining: 0 };
  }, [checkin, currentTime]);
  
  if (isLoading) {
      return <Skeleton className="h-24 w-full mt-6" />;
  }

  if (!checkin || !currentTask) {
    return (
       <Card className="mt-6 bg-muted/50 border-dashed">
            <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No task scheduled for the current time. You're in a free block!</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="mt-6 bg-primary/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 flex-grow">
                <Target className="h-8 w-8 text-primary" />
                <div>
                    <p className="text-sm text-primary font-semibold">NOW</p>
                    <p className="font-bold text-lg">{currentTask}</p>
                </div>
            </div>
            <div className="flex items-center gap-3 bg-background p-3 rounded-lg flex-shrink-0">
                <Clock className="h-6 w-6 text-muted-foreground" />
                 <div>
                    <p className="text-xs text-muted-foreground">Time Remaining</p>
                    <p className="font-mono font-bold text-xl">{formatDuration(timeRemaining)}</p>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
