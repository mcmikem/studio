

'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { MatchReportForm } from '@/components/forms/ofa/match-report-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function MatchReportPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <div className="space-y-4">
                 <Button variant="outline" asChild>
                    <Link href="/meal/ofa">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to OFA Hub
                    </Link>
                </Button>
                <MatchReportForm />
            </div>
        </Suspense>
    )
}

export default MatchReportPage;
