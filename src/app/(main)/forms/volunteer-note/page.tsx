
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { VolunteerNoteForm } from '@/components/forms/volunteer-note-form';

export default function VolunteerNotePage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <VolunteerNoteForm />
        </Suspense>
    )
}
