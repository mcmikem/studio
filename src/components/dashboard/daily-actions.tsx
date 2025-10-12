'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import { LogIn, LogOut, Video } from 'lucide-react';
import Link from 'next/link';

export function DailyActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Hub</CardTitle>
        <CardDescription>
          Your most frequent and important daily actions.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4">
        <Button asChild size="lg" className="h-16 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/daily-plan">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                <span className="text-lg font-semibold">Daily Check-in</span>
              </div>
              <p className="text-xs font-normal">Plan your day's mission</p>
            </div>
          </Link>
        </Button>
        <Button asChild size="lg" className="h-16 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
          <Link href="/forms/check-out">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                <span className="text-lg font-semibold">Daily Check-out</span>
              </div>
              <p className="text-xs font-normal">Report your impact</p>
            </div>
          </Link>
        </Button>
         <Button asChild size="lg" variant="outline" className="h-16">
          <Link href="/record-testimony">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">Record Testimony</span>
              </div>
              <p className="text-xs font-normal">Capture a success story</p>
            </div>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
