'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { RegisterSchoolForm } from '@/components/forms/school-xperience/register-school-form';

export default function RegisterSchoolPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <RegisterSchoolForm />
    </Suspense>
  );
}
