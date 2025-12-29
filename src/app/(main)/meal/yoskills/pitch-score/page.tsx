
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { PitchScoreForm } from '@/components/forms/yoskills/pitch-score-form';

function PitchScorePage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PitchScoreForm />
        </Suspense>
    )
}

export default PitchScorePage;
