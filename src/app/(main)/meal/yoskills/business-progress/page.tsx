
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { BusinessProgressForm } from '@/components/forms/yoskills/business-progress-form';

function BusinessProgressPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <BusinessProgressForm />
        </Suspense>
    )
}

export default BusinessProgressPage;
