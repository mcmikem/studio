
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { CircleRegistrationForm } from '@/components/forms/yoskills/circle-registration-form';

function CircleRegistrationPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <CircleRegistrationForm />
        </Suspense>
    )
}

export default CircleRegistrationPage;
