'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-32" />
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
              <Skeleton className="h-[400px] lg:col-span-2" />
              <Skeleton className="h-[400px]" />
            </div>
        </div>
    )
}
