
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CheckinForm } from '@/components/forms/checkin-form';
import { LogIn } from 'lucide-react';
import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

function CheckinFormPageContent() {
  return (
    <div className='space-y-4'>
        <Button variant="outline" asChild>
            <Link href="/forms">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Forms Hub
            </Link>
        </Button>
        <CheckinForm />
    </div>
  );
}

export default function CheckinFormPage() {
  return (
    <Suspense>
      <CheckinFormPageContent />
    </Suspense>
  );
}
