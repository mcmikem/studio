
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { PerformanceTrackingForm } from '@/components/forms/slf/performance-tracking-form';

function PerformanceTrackingPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PerformanceTrackingForm />
        </Suspense>
    )
}

export default PerformanceTrackingPage;
