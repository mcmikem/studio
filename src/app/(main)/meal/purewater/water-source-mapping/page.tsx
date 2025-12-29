
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { WaterSourceMappingForm } from '@/components/forms/purewater/water-source-mapping-form';

function WaterSourceMappingPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <WaterSourceMappingForm />
        </Suspense>
    )
}

export default WaterSourceMappingPage;
