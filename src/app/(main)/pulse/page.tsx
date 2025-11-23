
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ContentSubmissionForm } from '@/components/forms/pulse/content-submission-form';

function PulsePage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ContentSubmissionForm />
        </Suspense>
    )
}

export default PulsePage;
