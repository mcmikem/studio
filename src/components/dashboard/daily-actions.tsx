
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import { ArrowRight, LogOut } from 'lucide-react';
import Link from 'next/link';

export function DailyActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Hub</CardTitle>
        <CardDescription>
          Start your day with a plan and end it with a report.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4">
        <Button asChild size="lg" className="h-auto py-3 text-left justify-start">
          <Link href="/daily-plan">
            <div className='flex items-center w-full'>
              <div className='flex-grow'>
                <p className="font-semibold flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Daily Check-in
                </p>
                <p className="text-xs font-normal text-primary-foreground/80">Plan your day's mission</p>
              </div>
            </div>
          </Link>
        </Button>
        <Button asChild size="lg" className="h-auto py-3 text-left justify-start bg-secondary hover:bg-secondary/90 text-secondary-foreground">
          <Link href="/forms/check-out">
             <div className='flex items-center w-full'>
                <div className='flex-grow'>
                    <p className="font-semibold flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" />
                        Daily Check-out
                    </p>
                    <p className="text-xs font-normal text-secondary-foreground/80">Report your impact</p>
                </div>
            </div>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
