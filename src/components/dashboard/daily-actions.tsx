
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import { LogIn, LogOut, Sparkles, Check, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Checkin } from '@/lib/types';
import { Progress } from '../ui/progress';
import { useState, useEffect, useMemo } from 'react';
import { isWithinInterval, parse, startOfDay, differenceInMilliseconds, isValid } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit } from 'lucide-react';
import { useRouter } from 'next/navigation';


function formatDuration(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

interface DailyActionsProps {
    hour: number | null;
    checkin: Checkin | null;
    isLoadingCheckin: boolean;
}

export function DailyActions({ hour, checkin, isLoadingCheckin }: DailyActionsProps) {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // This ensures the Date object is only created on the client side
        setIsClient(true);
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const { currentTask, timeRemaining, progress } = useMemo(() => {
        if (!checkin?.details?.timeBlocks || !currentTime) {
          return { currentTask: null, timeRemaining: 0, progress: 0 };
        }
    
        const now = currentTime;
        const baseDate = startOfDay(now);
    
        for (const block of checkin.details.timeBlocks) {
          try {
            // Add defensive checks for time format
            if (!block.startTime || !block.endTime || !block.startTime.includes(':') || !block.endTime.includes(':')) continue;

            const startTime = parse(block.startTime, 'hh:mm a', baseDate);
            const endTime = parse(block.endTime, 'hh:mm a', baseDate);
    
             if (!isValid(startTime) || !isValid(endTime)) {
                console.error("Invalid time format in time block:", block);
                continue;
            }

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
    
    const handleStuck = () => {
        toast({
            title: "Let's get you unstuck!",
            description: "Redirecting you to the AI Coach for assistance.",
        });
        router.push('/chat');
    }
  
  if (isLoadingCheckin || hour === null || !isClient) {
      return <Skeleton className="h-48 w-full" />
  }

  // Morning Mode (before 12 PM) and user hasn't checked in yet
  if (hour < 12 && !checkin) {
     return (
        <Card className="bg-primary/10 border-primary/20 animated-glowing-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl"><Sparkles className="text-primary"/> It's a New Day!</CardTitle>
                <CardDescription>
                Start your day with intention. Let's create a strategic plan with your AI coach.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild size="lg" className="w-full text-lg h-12">
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
        <Card className="bg-accent/10 border-accent/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl"><LogOut className="text-accent"/> Wrap Up Your Day</CardTitle>
                <CardDescription>
                Report your impact, share your learnings, and submit your checkout report.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild size="lg" variant="default" className="w-full text-lg h-12 bg-accent hover:bg-accent/90 text-accent-foreground">
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
            <Card className="p-6 rounded-2xl bg-primary/10 border-2 border-primary/20 animated-glowing-border flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <p className="text-sm text-primary font-bold tracking-wider">CURRENT FOCUS</p>
                     <div className="flex items-center gap-2 text-primary font-mono">
                        <Clock className="h-5 w-5" />
                        <p className="text-2xl font-semibold">{formatDuration(timeRemaining)}</p>
                    </div>
                </div>
                <div>
                    <p className="text-3xl font-bold leading-tight font-headline">{currentTask}</p>
                </div>
                 <div className="pt-2">
                    <Progress value={progress} className="h-2"/>
                </div>
                <div className="flex items-center gap-4 pt-4">
                    <Button className="flex-1" size="lg" onClick={() => toast({ title: 'Task Marked Complete!', description: `Great job on finishing: "${currentTask}"`})}>
                        <Check className="mr-2 h-5 w-5" /> Mark Complete
                    </Button>
                    <Button variant="outline" className="flex-1" size="lg" onClick={handleStuck}>
                         <BrainCircuit className="mr-2 h-5 w-5" /> I'm Stuck?
                    </Button>
                </div>
            </Card>
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
