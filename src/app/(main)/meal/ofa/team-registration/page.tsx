'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const OFATeamRegistrationForm = dynamic(
  () => import('@/components/forms/ofa/team-registration-form').then(mod => mod.OFATeamRegistrationForm),
  {
    loading: () => <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>,
    ssr: false
  }
);

export default function TeamRegistrationPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <OFATeamRegistrationForm />
        </Suspense>
    )
}
