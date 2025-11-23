
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { EnvironmentalClubForm } from '@/components/forms/greenschools/environmental-club-form';

function EnvironmentalClubPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <EnvironmentalClubForm />
        </Suspense>
    )
}

export default EnvironmentalClubPage;
