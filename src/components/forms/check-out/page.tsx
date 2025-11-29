'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CheckoutForm } from '@/components/forms/checkout-form';
import { LogOut } from 'lucide-react';
import { Suspense } from 'react';

function CheckoutFormPageContent() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-4'>
            <LogOut className="h-8 w-8 text-primary" />
            <div>
                <CardTitle>Daily Check-out</CardTitle>
                <CardDescription>
                    Report your impact, share learnings, and plan tomorrow's win.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <CheckoutForm />
      </CardContent>
    </Card>
  );
}

export default function CheckoutFormPage() {
  return (
    <Suspense>
      <CheckoutFormPageContent />
    </Suspense>
  );
}
