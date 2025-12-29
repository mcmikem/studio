'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { VolunteerRegistrationForm } from '@/components/forms/talents/omuto-cup/volunteer-registration-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function VolunteerRegistrationPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <div className="space-y-4">
                <Button variant="outline" asChild>
                    <Link href="/meal">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to MEAL Hub
                    </Link>
                </Button>
                <VolunteerRegistrationForm />
            </div>
        </Suspense>
    )
}

export default VolunteerRegistrationPage;
