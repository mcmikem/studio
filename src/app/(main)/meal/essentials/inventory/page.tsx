'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { InventoryCheckForm } from '@/components/forms/essentials/inventory-check-form';

export default function MealInventoryCheckPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <InventoryCheckForm />
    </Suspense>
  );
}
