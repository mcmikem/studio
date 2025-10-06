'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import { LogIn, LogOut, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function DailyActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Actions</CardTitle>
        <CardDescription>
          Start your day with a strategic plan and end it with a clear report.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <Button asChild size="lg" className="h-20 flex-col gap-2">
            <Link href="/forms">
                <LogIn className="h-6 w-6" />
                <span>Daily Check-in</span>
            </Link>
        </Button>
        <Button asChild size="lg" className="h-20 flex-col gap-2" variant="secondary">
             <Link href="/forms">
                <LogOut className="h-6 w-6" />
                <span>Daily Check-out</span>
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

    