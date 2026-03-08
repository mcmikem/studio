'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const rootPaths = new Set(['/', '/login']);

export function GlobalBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (!pathname || rootPaths.has(pathname)) {
    return null;
  }

  return (
    <div className="mb-3 sm:mb-4">
      <Button
        type="button"
        variant="outline"
        className="h-9 px-3"
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
            return;
          }
          router.push('/');
        }}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
    </div>
  );
}
