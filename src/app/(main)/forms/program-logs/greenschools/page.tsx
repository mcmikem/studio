
'use client';

import { ProgramActivityForm } from '@/components/forms/program-activity-form';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function GreenSchoolsFormPage() {
    return (
        <ProgramActivityForm
            programTitle="GreenSchools Campaign"
            formDescription="Log a new activity for the GreenSchools Campaign. Fill out the sections below to calculate ROI and capture important M&E data."
            showTreesPlanted
        />
    )
}

export default function GreenSchoolsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <GreenSchoolsFormPage />
        </Suspense>
    )
}
