
'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

const unprotectedRoutes = ['/login'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthRoute = unprotectedRoutes.includes(pathname);

  useEffect(() => {
    if (isUserLoading) return; // Wait for user status

    if (!user && !isAuthRoute) {
      router.push('/login');
    }
    if (user && isAuthRoute) {
      router.push('/');
    }
  }, [user, isUserLoading, router, pathname, isAuthRoute]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If no user and trying to access a protected route, show loader while redirecting.
  if (!user && !isAuthRoute) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Render children (either the login page or the main app layout)
  return (
      <>
        <FirebaseErrorListener />
        {children}
      </>
  );
}
