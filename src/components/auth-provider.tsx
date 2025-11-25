'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

const unprotectedRoutes = ['/login', '/forms/school'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isUnprotectedRoute = unprotectedRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    // This effect handles redirection logic once loading is complete.
    if (isUserLoading) return;

    if (!user && !isUnprotectedRoute) {
      router.push('/login');
    }
    
    if (user && isUnprotectedRoute) {
      router.push('/');
    }
  }, [user, isUserLoading, router, pathname, isUnprotectedRoute]);


  // This is the core fix:
  // Render a global loader if we are on a protected route and the user's auth state is still being checked.
  if (!isUnprotectedRoute && isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If we are on an unprotected route, or if all loading is complete, render the app.
  return (
      <>
        <FirebaseErrorListener />
        {children}
      </>
  );
}
