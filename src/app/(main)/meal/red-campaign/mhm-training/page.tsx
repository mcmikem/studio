'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { MhmTrainingForm } from '@/components/forms/red-campaign/mhm-training-form';

function MhmTrainingPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <MhmTrainingForm />
        </Suspense>
    )
}

export default MhmTrainingPage;
