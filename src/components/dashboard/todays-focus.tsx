
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Target, Clock } from 'lucide-react';
import type { Checkin } from '@/lib/types';
import { isWithinInterval, parse, startOfDay, differenceInMilliseconds } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';

interface TodaysFocusProps {
  checkin: Checkin | null;
  isLoading: boolean;
}

function formatDuration(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function TodaysFocus({ checkin, isLoading }: TodaysFocusProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { currentTask, timeRemaining, progress } = useMemo(() => {
    if (!checkin?.details.timeBlocks) {
      return { currentTask: null, timeRemaining: 0, progress: 0 };
    }

    const now = currentTime;
    const baseDate = startOfDay(now);

    for (const block of checkin.details.timeBlocks) {
      try {
        const startTime = parse(block.startTime, 'hh:mm a', baseDate);
        const endTime = parse(block.endTime, 'hh:mm a', baseDate);

        if (isWithinInterval(now, { start: startTime, end: endTime })) {
          const remaining = differenceInMilliseconds(endTime, now);
          const totalDuration = differenceInMilliseconds(endTime, startTime);
          const currentProgress = totalDuration > 0 ? (remaining / totalDuration) * 100 : 0;
          return { currentTask: block.description, timeRemaining: remaining, progress: currentProgress };
        }
      } catch (e) {
        console.error("Error parsing time block for focus card:", block, e);
      }
    }

    return { currentTask: null, timeRemaining: 0, progress: 0 };
  }, [checkin, currentTime]);
  
  if (isLoading) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (!checkin || !currentTask) {
    return (
       <div className="mt-6 p-4 text-center rounded-lg bg-muted/50 border-dashed border">
          <p className="text-sm text-muted-foreground">You're in a free block! Plan your next move or take a well-deserved break.</p>
       </div>
    );
  }

  return (
    <div className="mt-6 p-4 rounded-lg bg-background border border-border flex flex-col md:flex-row items-center gap-4">
      <div className="flex items-center gap-3 flex-grow w-full">
        <Target className="h-6 w-6 text-primary flex-shrink-0" />
        <div>
          <p className="text-xs text-primary font-semibold">NOW</p>
          <p className="font-semibold leading-tight">{currentTask}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto md:max-w-xs flex-shrink-0">
         <div className="flex-grow">
          <Progress value={progress} className="h-2"/>
        </div>
        <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="font-mono text-sm font-semibold">{formatDuration(timeRemaining)}</p>
        </div>
      </div>
    </div>
  );
}
