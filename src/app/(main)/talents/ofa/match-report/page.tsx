
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { MatchReportForm } from '@/components/forms/talents/ofa/match-report-form';

function MatchReportPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <MatchReportForm />
        </Suspense>
    )
}

export default MatchReportPage;
