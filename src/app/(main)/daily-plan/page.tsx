'use client';
import { PlannerCheckinForm } from '@/components/forms/planner-checkin-form';
import { CalendarCheck } from 'lucide-react';
import { Suspense } from 'react';

function DailyPlanPageContent() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarCheck className="h-8 w-8" />
          AI Daily Planner
        </h1>
        <p className="text-muted-foreground">
          Strategize your day with your AI coach, then submit your final check-in.
        </p>
      </header>
      <PlannerCheckinForm />
    </div>
  );
}

export default function DailyPlanPage() {
    return (
        <Suspense>
            <DailyPlanPageContent />
        </Suspense>
    )
}
