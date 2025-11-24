
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function ScoreSheetPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <div className="text-center p-8">Coming Soon: Omuto Cup Score Sheet</div>
        </Suspense>
    )
}

export default ScoreSheetPage;
