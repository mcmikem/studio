'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { StockAdjustmentForm } from '@/components/forms/essentials/stock-adjustment-form';

export default function StockAdjustmentPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <StockAdjustmentForm />
        </Suspense>
    )
}
