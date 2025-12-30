
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { SchoolVisitForm } from '@/components/forms/red-campaign/school-visit-form';

function SchoolVisitPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SchoolVisitForm />
        </Suspense>
    )
}

export default SchoolVisitPage;
