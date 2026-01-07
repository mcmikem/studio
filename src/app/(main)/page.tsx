
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { DashboardLoader, type DashboardProps } from '@/components/dashboard/dashboard-loader';

export default function HomePage({ profile }: DashboardProps) {
  if (!profile) {
    // This can be a fallback or a default view if profile is somehow null
    return (
      <div className="flex h-full items-center justify-center">
        <p>No profile data available.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
        <DashboardLoader profile={profile} />
    </Suspense>
  );
}
