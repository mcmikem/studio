
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ActivityReportForm } from '@/components/forms/activity-report-form';
import { BarChart3, ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function ActivityFormPageContent() {
  return (
    <div className='space-y-4'>
        <Button variant="outline" asChild>
            <Link href="/forms">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Forms Hub
            </Link>
        </Button>
        <Card>
          <CardHeader>
            <div className='flex items-center gap-4'>
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle>Log General Activity (ROI)</CardTitle>
                    <CardDescription>
                    Report a field activity and calculate its return on investment.
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <ActivityReportForm />
          </CardContent>
        </Card>
    </div>
  );
}

export default function ActivityFormPage() {
  return (
    <Suspense>
      <ActivityFormPageContent />
    </Suspense>
  );
}
