'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { OFAMatchSummaryForm } from '@/components/forms/ofa/match-summary-form';

function MatchSummaryPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <OFAMatchSummaryForm />
        </Suspense>
    )
}

export default MatchSummaryPage;
