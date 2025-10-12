
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ActivityReportForm } from '@/components/forms/activity-report-form';
import { BarChart3 } from 'lucide-react';
import { Suspense } from 'react';

function ActivityFormPageContent() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-4'>
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
                <CardTitle>Activity Report & ROI Calculator</CardTitle>
                <CardDescription>
                Plan your activity to maximize impact and log the results.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <ActivityReportForm />
      </CardContent>
    </Card>
  );
}

export default function ActivityFormPage() {
  return (
    <Suspense>
      <ActivityFormPageContent />
    </Suspense>
  );
}
