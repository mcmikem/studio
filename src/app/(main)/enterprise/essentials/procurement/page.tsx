'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { MaterialPurchaseForm } from '@/components/forms/essentials/material-purchase-form';

export default function ProcurementPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <MaterialPurchaseForm />
        </Suspense>
    )
}
