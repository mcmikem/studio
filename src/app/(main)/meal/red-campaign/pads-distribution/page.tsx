
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { PadsDistributionForm } from '@/components/forms/red-campaign/pads-distribution-form';

export default function PadsDistributionPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PadsDistributionForm />
        </Suspense>
    )
}
