

'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { OFATeamRegistrationForm } from '@/components/forms/ofa/team-registration-form';


function TeamRegistrationPageContent() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <OFATeamRegistrationForm />
        </Suspense>
    )
}


export default function TeamRegistrationPage() {
    return <TeamRegistrationPageContent />;
}

