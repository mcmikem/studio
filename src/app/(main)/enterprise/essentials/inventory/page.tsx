
'use client';

import { Suspense } from 'react';
import { Loader2, List, ArrowLeft } from 'lucide-react';
import { InventoryCheckForm } from '@/components/forms/essentials/inventory-check-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

function InventoryCheckPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
             <div className="enterprise-form-shell">
                <Button variant="outline" asChild>
                    <Link href="/enterprise/essentials">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Essentials Hub
                    </Link>
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <List className="h-6 w-6" />
                            Inventory Stock Check
                        </CardTitle>
                        <CardDescription>
                            Perform a physical stock count to update and correct inventory levels.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InventoryCheckForm />
                    </CardContent>
                </Card>
            </div>
        </Suspense>
    )
}

export default InventoryCheckPage;

    
