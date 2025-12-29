
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { GrantAccountabilityForm } from '@/components/forms/yap/grant-accountability-form';

function GrantAccountabilityPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <GrantAccountabilityForm />
        </Suspense>
    )
}

export default GrantAccountabilityPage;
