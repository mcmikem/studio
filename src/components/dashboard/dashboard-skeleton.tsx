'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-32" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Skeleton className="h-[400px] md:col-span-4" />
              <Skeleton className="h-[400px] md:col-span-3" />
            </div>
        </div>
    )
}
