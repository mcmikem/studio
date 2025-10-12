
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CreateAlertForm } from '@/components/forms/create-alert-form';
import { Megaphone } from 'lucide-react';
import { Suspense } from 'react';

function AlertFormPageContent() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-4'>
            <Megaphone className="h-8 w-8 text-primary" />
            <div>
                <CardTitle>Create New Alert</CardTitle>
                <CardDescription>
                Broadcast an important message or announcement to the entire team.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <CreateAlertForm />
      </CardContent>
    </Card>
  );
}

export default function AlertFormPage() {
  return (
    <Suspense>
      <AlertFormPageContent />
    </Suspense>
  );
}
