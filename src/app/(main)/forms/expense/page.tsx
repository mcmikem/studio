
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ExpenseReportForm } from '@/components/forms/expense-report-form';
import { Receipt } from 'lucide-react';
import { Suspense } from 'react';

function ExpenseFormPageContent() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-4'>
            <Receipt className="h-8 w-8 text-primary" />
            <div>
                <CardTitle>New Expense Report</CardTitle>
                <CardDescription>
                  Submit a new expense for reimbursement or request funds for an activity.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <ExpenseReportForm />
      </CardContent>
    </Card>
  );
}

export default function ExpenseFormPage() {
  return (
    <Suspense>
      <ExpenseFormPageContent />
    </Suspense>
  );
}
