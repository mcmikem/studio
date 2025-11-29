'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { OFAEquipmentImpactForm } from '@/components/forms/ofa/equipment-impact-form';

function EquipmentTrackerPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <OFAEquipmentImpactForm />
        </Suspense>
    )
}

export default EquipmentTrackerPage;
