'use client';

import { ActivityReportForm } from '@/components/forms/activity-report-form';
import { Card, CardContent } from '@/components/ui/card';

export default function ROICalculatorPage() {

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Field Activity ROI Calculator
        </h1>
        <p className="text-muted-foreground">
          A two-step process to plan for maximum impact and log your results.
        </p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <ActivityReportForm />
        </CardContent>
      </Card>
    </div>
  );
}
