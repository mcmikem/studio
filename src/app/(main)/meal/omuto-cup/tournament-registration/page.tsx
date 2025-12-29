
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { TournamentRegistrationForm } from '@/components/forms/talents/omuto-cup/tournament-registration-form';

function TournamentRegistrationPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <TournamentRegistrationForm />
        </Suspense>
    )
}

export default TournamentRegistrationPage;
