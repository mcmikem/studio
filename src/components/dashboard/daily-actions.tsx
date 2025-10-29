
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import { ArrowRight, LogIn, LogOut } from 'lucide-react';
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
        <Button asChild size="lg" className="h-auto py-4 text-left justify-start text-base">
          <Link href="/daily-plan">
            <div className='flex items-center w-full'>
              <LogIn className="mr-4 h-6 w-6" />
              <div className='flex-grow'>
                <p className="font-semibold">
                  Plan My Day
                </p>
                <p className="text-xs font-normal text-primary-foreground/80">AI-assisted check-in</p>
              </div>
               <ArrowRight className="ml-auto h-5 w-5" />
            </div>
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="h-auto py-4 text-left justify-start text-base">
          <Link href="/forms/check-out">
             <div className='flex items-center w-full'>
               <LogOut className="mr-4 h-6 w-6" />
                <div className='flex-grow'>
                    <p className="font-semibold">
                        Daily Check-out
                    </p>
                    <p className="text-xs font-normal text-secondary-foreground/80">Report your impact</p>
                </div>
                 <ArrowRight className="ml-auto h-5 w-5" />
            </div>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
