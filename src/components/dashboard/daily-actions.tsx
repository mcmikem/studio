
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import { ArrowRight, LogIn, LogOut, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DailyActionsProps {
    hour: number;
    hasCheckedIn: boolean;
}

export function DailyActions({ hour, hasCheckedIn }: DailyActionsProps) {
  
  // Morning (before 12 PM) and user hasn't checked in yet
  if (hour < 12 && !hasCheckedIn) {
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

  // Evening (5 PM or later)
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

  // If it's midday or user has already checked in, don't show anything.
  return null;
}
