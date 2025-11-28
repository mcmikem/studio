
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { PlayerRegistrationForm } from '@/components/forms/talents/ofa/player-registration-form';

function PlayerRegistrationPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PlayerRegistrationForm />
        </Suspense>
    )
}

export default PlayerRegistrationPage;

    