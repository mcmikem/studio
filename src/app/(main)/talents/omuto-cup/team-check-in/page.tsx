
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function TeamCheckinPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <div className="text-center p-8">Coming Soon: Team Check-in Form</div>
        </Suspense>
    )
}

export default TeamCheckinPage;
