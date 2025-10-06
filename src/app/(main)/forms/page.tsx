'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckinForm } from '@/components/forms/checkin-form';
import { CheckoutForm } from '@/components/forms/checkout-form';
import { ClipboardEdit, LogIn, LogOut, BarChart3 } from 'lucide-react';
import { ActivityReportForm } from '@/components/forms/activity-report-form';

export default function FormsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardEdit className="h-8 w-8" />
          Forms Hub
        </h1>
        <p className="text-muted-foreground">
          Your central place for all daily check-ins, reports, and logs.
        </p>
      </header>

      <Tabs defaultValue="check-in" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="check-in">
            <LogIn className="mr-2 h-4 w-4" />
            Daily Check-in
          </TabsTrigger>
          <TabsTrigger value="check-out">
            <LogOut className="mr-2 h-4 w-4" />
            Daily Check-out
          </TabsTrigger>
          <TabsTrigger value="activity">
             <BarChart3 className="mr-2 h-4 w-4" />
            Activity Report
          </TabsTrigger>
          <TabsTrigger value="volunteer" disabled>
            New Volunteer
          </TabsTrigger>
          <TabsTrigger value="expense" disabled>
            Expense Report
          </TabsTrigger>
        </TabsList>
        <TabsContent value="check-in">
          <CheckinForm />
        </TabsContent>
        <TabsContent value="check-out">
          <CheckoutForm />
        </TabsContent>
         <TabsContent value="activity">
          <Card>
            <CardContent className="pt-6">
              <ActivityReportForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
