
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { CommunityFeedbackForm } from '@/components/forms/community/feedback-form';

function FeedbackPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <CommunityFeedbackForm />
        </Suspense>
    )
}

export default FeedbackPage;
