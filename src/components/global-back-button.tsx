'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

const rootPaths = new Set(['/', '/login']);

export function GlobalBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Check if there's meaningful navigation history within the app
    setCanGoBack(window.history.length > 1 && document.referrer.includes(window.location.origin));
  }, []);

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
          if (canGoBack) {
            router.back();
          } else {
            router.push('/');
          }
        }}
      >
        {canGoBack ? <ArrowLeft className="mr-2 h-4 w-4" /> : <Home className="mr-2 h-4 w-4" />}
        {canGoBack ? 'Back' : 'Home'}
      </Button>
    </div>
  );
}
