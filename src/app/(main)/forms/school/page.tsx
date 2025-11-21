'use client';
import { SchoolApplicationForm } from '@/components/forms/school-application-form';
import { School } from 'lucide-react';
import { Suspense } from 'react';

function SchoolApplicationPageContent() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
          <School className="h-8 w-8" />
          Omuto School Programs Application Form
        </h1>
        <p className="text-muted-foreground">
         Thank you for your interest in bringing Omuto programs to your school! This form will help us understand your needs and match you with the most impactful program for your students.
        </p>
      </header>
      <SchoolApplicationForm />
    </div>
  );
}

export default function SchoolApplicationPage() {
    return (
        <Suspense>
            <SchoolApplicationPageContent />
        </Suspense>
    )
}
