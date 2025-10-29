
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import { ArrowRight, LogIn, LogOut, Sparkles, Check, Clock, Target as TargetIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Checkin } from '@/lib/types';
import { Progress } from '../ui/progress';
import { useState, useEffect, useMemo } from 'react';
import { isWithinInterval, parse, startOfDay, differenceInMilliseconds } from 'date-fns';
import { Skeleton } from '../ui/skeleton';


function formatDuration(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

interface DailyActionsProps {
    hour: number;
    checkin: Checkin | null;
    isLoadingCheckin: boolean;
}

export function DailyActions({ hour, checkin, isLoadingCheckin }: DailyActionsProps) {
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
  
  if (isLoadingCheckin) {
      return <Skeleton className="h-48 w-full" />
  }

  // Morning Mode (before 12 PM) and user hasn't checked in yet
  if (hour < 12 && !checkin) {
     return (
        <Card className="bg-primary/10 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> It's a New Day!</CardTitle>
                <CardDescription>
                Start your day with intention. Let's create a strategic plan with your AI coach.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild size="lg" className="w-full">
                <Link href="/daily-plan">
                    <LogIn className="mr-2 h-5 w-5" />
                    Plan My Day
                </Link>
                </Button>
            </CardContent>
        </Card>
    );
  }

  // Evening Mode (5 PM or later)
  if (hour >= 17) {
    return (
        <Card className="bg-blue-500/10 border-blue-500/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><LogOut className="text-blue-500"/> Wrap Up Your Day</CardTitle>
                <CardDescription>
                Report your impact, share your learnings, and submit your checkout report.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild size="lg" variant="secondary" className="w-full bg-blue-500/80 hover:bg-blue-500 text-white">
                <Link href="/forms/check-out">
                    <LogOut className="mr-2 h-5 w-5" />
                    Daily Check-out
                </Link>
                </Button>
            </CardContent>
        </Card>
    );
  }
  
  // Workday mode, after checking in
  if (checkin) {
    if (currentTask) {
        return (
            <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary/20 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 bg-primary text-primary-foreground h-12 w-12 rounded-lg flex items-center justify-center">
                        <TargetIcon className="h-7 w-7" />
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
    } else {
        // Checked in, but not in a scheduled block
        return (
            <div className="p-6 text-center rounded-lg bg-muted/50 border-dashed border">
                <p className="font-semibold text-lg flex items-center justify-center gap-2"><Check className="text-green-500"/> You're in a free block!</p>
                <p className="text-sm text-muted-foreground">Plan your next move, take a break, or get ahead on your next task.</p>
            </div>
        );
    }
  }


  // Fallback: If it's midday and user hasn't checked in, don't show the big card.
  return null;
}
