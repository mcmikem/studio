'use client';

import { ProgramActivityForm } from '@/components/forms/program-activity-form';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function YoSkillsFormPage() {
    return (
        <ProgramActivityForm
            programTitle="YoSkills Entrepreneurship"
            formDescription="Log a new activity for the YoSkills Entrepreneurship program. Fill out the sections below to calculate ROI and capture important M&E data."
        />
    )
}

export default function YoSkillsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <YoSkillsFormPage />
        </Suspense>
    )
}
