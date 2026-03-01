
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { SystemFeedbackForm } from '@/components/forms/system/system-feedback-form';

function SystemFeedbackPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SystemFeedbackForm />
        </Suspense>
    )
}

export default SystemFeedbackPage;
