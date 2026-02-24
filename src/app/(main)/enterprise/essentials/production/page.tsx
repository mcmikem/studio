'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ProductionBatchForm } from '@/components/forms/essentials/production-batch-form';

function ProductionPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ProductionBatchForm />
        </Suspense>
    )
}

export default ProductionPage;
