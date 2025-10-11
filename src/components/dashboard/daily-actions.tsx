
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import { LogIn, LogOut } from 'lucide-react';
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
        <Button asChild size="lg" className="h-16">
          <Link href="/forms">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                <span className="text-lg font-semibold">Daily Check-in</span>
              </div>
              <p className="text-xs font-normal">Plan your day's mission</p>
            </div>
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="h-16">
          <Link href="/forms?tab=check-out">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                <span className="text-lg font-semibold">Daily Check-out</span>
              </div>
              <p className="text-xs font-normal">Report your impact</p>
            </div>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
