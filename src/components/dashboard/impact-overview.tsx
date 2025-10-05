'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '../ui/skeleton';

export function ImpactOverview({isLoading = true}: {isLoading?: boolean}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Impact Overview (Real Numbers)</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {isLoading && (
             Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                </div>
            ))
        )}
        {!isLoading && (
             <div className="md:col-span-2 text-center text-muted-foreground py-8">
                No impact metrics to display. Connect to a data source.
             </div>
        )}
       {/* Live data will be mapped here */}
      </CardContent>
    </Card>
  );
}
