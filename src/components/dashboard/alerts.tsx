'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const alertIcons = {
    Urgent: <AlertTriangle className="h-4 w-4 text-red-500" />,
    Reminder: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    Info: <Info className="h-4 w-4 text-blue-500" />,
};

const alertColors = {
    High: "border-red-500 bg-red-500/10 text-red-500",
    Medium: "border-yellow-500 bg-yellow-500/10 text-yellow-500",
    Low: "border-blue-500 bg-blue-500/10 text-blue-500",
};


export function Alerts({isLoading = true}: {isLoading?: boolean}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts & Notifications</CardTitle>
        <CardDescription>Urgent issues and important reminders.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
            Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                    <Skeleton className="h-5 w-5 mt-1" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-8 w-16 self-center" />
                </div>
            ))
        )}
        {!isLoading && (
            <div className="text-center text-muted-foreground py-8">
                No alerts to display.
            </div>
        )}
        {/* Live data will be mapped here */}
      </CardContent>
    </Card>
  );
}
