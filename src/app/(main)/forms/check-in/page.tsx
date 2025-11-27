
'use client';

import { CheckinForm } from '@/components/forms/checkin-form';
import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

function CheckinFormPageContent() {
  return (
    <div className='space-y-4'>
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
