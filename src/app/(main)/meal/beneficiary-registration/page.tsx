
      
'use client';

import { Suspense } from 'react';
import { BeneficiaryRegistrationForm } from '@/components/forms/beneficiary-registration-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BeneficiaryRegistrationPage() {
    return (
        <Suspense>
            <div className="space-y-4">
                <Button variant="outline" asChild>
                    <Link href="/meal">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to MEAL Hub
                    </Link>
                </Button>
                <BeneficiaryRegistrationForm />
            </div>
        </Suspense>
    )
}

    