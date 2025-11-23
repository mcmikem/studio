
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { TrainingAttendanceForm } from '@/components/forms/slf/training-attendance-form';

function TrainingAttendancePage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <TrainingAttendanceForm />
        </Suspense>
    )
}

export default TrainingAttendancePage;
