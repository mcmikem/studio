'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { OFAAdvancedAnalysisForm } from '@/components/forms/ofa/advanced-analysis-form';

function AdvancedAnalysisPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <OFAAdvancedAnalysisForm />
        </Suspense>
    )
}

export default AdvancedAnalysisPage;
