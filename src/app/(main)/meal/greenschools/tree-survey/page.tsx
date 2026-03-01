
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { TreeSurveyForm } from '@/components/forms/greenschools/tree-survey-form';

export default function TreeSurveyPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <TreeSurveyForm />
        </Suspense>
    )
}
