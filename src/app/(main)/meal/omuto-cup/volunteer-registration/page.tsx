
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { VolunteerRegistrationForm } from '@/components/forms/talents/omuto-cup/volunteer-registration-form';

function VolunteerRegistrationPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <VolunteerRegistrationForm />
        </Suspense>
    )
}

export default VolunteerRegistrationPage;
