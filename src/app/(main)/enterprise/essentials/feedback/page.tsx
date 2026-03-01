
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { CustomerFeedbackForm } from '@/components/forms/essentials/customer-feedback-form';

export default function CustomerFeedbackPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <CustomerFeedbackForm />
        </Suspense>
    )
}
