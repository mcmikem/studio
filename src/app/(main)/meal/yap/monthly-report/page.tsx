
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { MonthlyReportForm } from '@/components/forms/yap/monthly-report-form';

function MonthlyReportPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <MonthlyReportForm />
        </Suspense>
    )
}

export default MonthlyReportPage;
