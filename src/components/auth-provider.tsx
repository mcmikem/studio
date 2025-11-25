
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

  const isUnprotectedRoute = unprotectedRoutes.some(route => pathname === route);

  useEffect(() => {
    // Wait until Firebase has determined the auth state
    if (isUserLoading) return; 

    // If there's no user and we are on a protected route, redirect to login
    if (!user && !isUnprotectedRoute) {
      router.push('/login');
    }
    // If there is a user and we are on an auth route (like /login), redirect to home
    if (user && isUnprotectedRoute) {
      router.push('/');
    }
  }, [user, isUserLoading, router, pathname, isUnprotectedRoute]);


  // While checking auth state on a protected route, show a global loader.
  if (isUserLoading && !isUnprotectedRoute) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If we have a user, or we are on an unprotected route (and finished loading), render the children.
  return (
      <>
        <FirebaseErrorListener />
        {children}
      </>
  );
}
