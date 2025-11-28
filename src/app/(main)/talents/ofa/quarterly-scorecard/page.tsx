
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { QuarterlyScorecardForm } from '@/components/forms/talents/ofa/quarterly-scorecard-form';

function QuarterlyScorecardPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <QuarterlyScorecardForm />
        </Suspense>
    )
}

export default QuarterlyScorecardPage;
