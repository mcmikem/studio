'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ChapterRegistrationForm } from '@/components/forms/yap/chapter-registration-form';

function ChapterRegistrationPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ChapterRegistrationForm />
        </Suspense>
    )
}

export default ChapterRegistrationPage;
