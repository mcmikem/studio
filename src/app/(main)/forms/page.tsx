
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CheckoutForm } from '@/components/forms/checkout-form';
import { ClipboardEdit, LogOut, BarChart3, Receipt, LogIn, Megaphone } from 'lucide-react';
import { ActivityReportForm } from '@/components/forms/activity-report-form';
import { ExpenseReportForm } from '@/components/forms/expense-report-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CheckinForm } from '@/components/forms/checkin-form';
import { CreateAlertForm } from '@/components/forms/create-alert-form';

function FormsContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'check-in';

  return (
     <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardEdit className="h-8 w-8" />
          Forms Hub
        </h1>
        <p className="text-muted-foreground">
          Your central place for all daily reports, and logs.
        </p>
      </header>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto md:h-10">
            <TabsTrigger value="check-in" className="py-2">
            <LogIn className="mr-2 h-4 w-4" />
            Daily Check-in
            </TabsTrigger>
            <TabsTrigger value="check-out" className="py-2">
            <LogOut className="mr-2 h-4 w-4" />
            Daily Check-out
            </TabsTrigger>
            <TabsTrigger value="activity" className="py-2">
            <BarChart3 className="mr-2 h-4 w-4" />
            Activity Report
            </TabsTrigger>
            <TabsTrigger value="expense" className="py-2">
            <Receipt className="mr-2 h-4 w-4" />
            Expense Report
            </TabsTrigger>
             <TabsTrigger value="alert" className="py-2">
            <Megaphone className="mr-2 h-4 w-4" />
            Create Alert
            </TabsTrigger>
        </TabsList>
         <TabsContent value="check-in">
          <CheckinForm />
        </TabsContent>
        <TabsContent value="check-out">
          <Card>
            <CardHeader>
              <CardTitle>Daily Check-out</CardTitle>
              <CardDescription>
                Report your impact, share learnings, and plan tomorrow's win.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CheckoutForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Report & ROI Calculator</CardTitle>
              <CardDescription>
                Plan your activity to maximize impact and log the results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityReportForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="expense">
          <Card>
             <CardHeader>
              <CardTitle>New Expense Report</CardTitle>
              <CardDescription>
                Submit a new expense for reimbursement or request funds for an activity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseReportForm />
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="alert">
          <Card>
             <CardHeader>
              <CardTitle>Create New Alert</CardTitle>
              <CardDescription>
                Broadcast an important message or announcement to the entire team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateAlertForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function FormsPage() {
    return (
        <Suspense>
            <FormsContent />
        </Suspense>
    );
}
