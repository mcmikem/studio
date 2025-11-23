
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { SchoolRegistrationForm } from '@/components/forms/slf/school-registration-form';

function SchoolRegistrationPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SchoolRegistrationForm />
        </Suspense>
    )
}

export default SchoolRegistrationPage;
