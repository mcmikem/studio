
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Target, Clock, Check } from 'lucide-react';
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
          const elapsed = totalDuration - remaining;
          const currentProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
          return { currentTask: block.description, timeRemaining: remaining, progress: currentProgress };
        }
      } catch (e) {
        console.error("Error parsing time block for focus card:", block, e);
      }
    }

    return { currentTask: null, timeRemaining: 0, progress: 0 };
  }, [checkin, currentTime]);
  
  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  // If checked in but not currently in a scheduled block
  if (checkin && !currentTask) {
    return (
       <div className="mt-2 p-6 text-center rounded-lg bg-muted/50 border-dashed border">
          <p className="font-semibold text-lg flex items-center justify-center gap-2"><Check className="text-green-500"/> You're in a free block!</p>
          <p className="text-sm text-muted-foreground">Plan your next move, take a break, or get ahead on your next task.</p>
       </div>
    );
  }

  // If not checked in, we show nothing (the DailyActions card will handle the prompt)
  if (!checkin) {
      return null;
  }

  return (
    <div className="mt-2 p-4 rounded-lg bg-primary/10 border-2 border-primary/20 flex flex-col gap-4">
        <div className="flex items-center gap-4">
             <div className="flex-shrink-0 bg-primary text-primary-foreground h-12 w-12 rounded-lg flex items-center justify-center">
                <Target className="h-7 w-7" />
            </div>
            <div>
                <p className="text-sm text-primary font-bold tracking-wider">CURRENT FOCUS</p>
                <p className="text-xl font-bold leading-tight">{currentTask}</p>
            </div>
        </div>
      <div className="flex items-center gap-3 w-full">
         <div className="flex-grow">
          <Progress value={progress} className="h-2"/>
        </div>
        <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="font-mono text-lg font-semibold">{formatDuration(timeRemaining)}</p>
        </div>
      </div>
    </div>
  );
}
