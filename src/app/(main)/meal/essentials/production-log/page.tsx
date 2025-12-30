
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ProductionLogForm } from '@/components/forms/essentials/production-log-form';

function ProductionLogPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ProductionLogForm />
        </Suspense>
    )
}

export default ProductionLogPage;
