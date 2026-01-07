'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';

export default function HomePage() {
  return (
     <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
        <DashboardLoader />
    </Suspense>
  );
}
