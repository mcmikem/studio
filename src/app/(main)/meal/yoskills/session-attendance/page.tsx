
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { SessionAttendanceForm } from '@/components/forms/yoskills/session-attendance-form';

function SessionAttendancePage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SessionAttendanceForm />
        </Suspense>
    )
}

export default SessionAttendancePage;
