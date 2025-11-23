
'use client';

import { ProgramActivityForm } from '@/components/forms/program-activity-form';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function RedCampaignFormPage() {
    return (
        <ProgramActivityForm
            programTitle="RED Campaign"
            formDescription="Log a new activity for the RED Campaign. Fill out the sections below to calculate ROI and capture important M&E data."
            showParentsAttended
            showTeachersAttended
        />
    )
}

export default function RedCampaignPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <RedCampaignFormPage />
        </Suspense>
    )
}
