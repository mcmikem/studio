
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { PrefectRegistrationForm } from '@/components/forms/slf/prefect-registration-form';

function PrefectRegistrationPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PrefectRegistrationForm />
        </Suspense>
    )
}

export default PrefectRegistrationPage;
