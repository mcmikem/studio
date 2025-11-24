'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { WasteAuditForm } from '@/components/forms/greenschools/waste-audit-form';

function WasteAuditPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <WasteAuditForm />
        </Suspense>
    )
}

export default WasteAuditPage;
