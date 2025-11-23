
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { SalesTrackingForm } from '@/components/forms/essentials/sales-tracking-form';

function SalesTrackingPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SalesTrackingForm />
        </Suspense>
    )
}

export default SalesTrackingPage;
