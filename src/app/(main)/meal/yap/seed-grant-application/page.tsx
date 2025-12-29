
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { SeedGrantApplicationForm } from '@/components/forms/yap/seed-grant-application-form';

function SeedGrantApplicationPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SeedGrantApplicationForm />
        </Suspense>
    )
}

export default SeedGrantApplicationPage;
