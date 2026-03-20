'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { LogVisitForm } from '@/components/forms/school-xperience/log-visit-form';

export default function LogVisitPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <LogVisitForm />
    </Suspense>
  );
}
