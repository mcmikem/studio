
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

  const isAuthRoute = unprotectedRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    // Wait until Firebase has determined the auth state
    if (isUserLoading) return; 

    // If there's no user and we are on a protected route, redirect to login
    if (!user && !isAuthRoute) {
      router.push('/login');
    }
    // If there is a user and we are on an auth route (like /login), redirect to home
    if (user && isAuthRoute) {
      router.push('/');
    }
  }, [user, isUserLoading, router, pathname, isAuthRoute]);


  // While checking auth state, show a global loader.
  // Or, if we are about to redirect, show a loader to prevent flicker.
  if (isUserLoading || (!user && !isAuthRoute)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If we have a user, or we are on an unprotected route, render the children
  return (
      <>
        <FirebaseErrorListener />
        {children}
      </>
  );
}
