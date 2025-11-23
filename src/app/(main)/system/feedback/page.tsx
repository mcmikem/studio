

'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { BugReportForm } from '@/components/forms/system/bug-report-form';

function SystemFeedbackPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <BugReportForm />
        </Suspense>
    )
}

export default SystemFeedbackPage;
