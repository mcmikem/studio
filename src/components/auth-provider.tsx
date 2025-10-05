'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const protectedRoutes = ['/', '/plan', '/reports', '/roi-calculator', '/impact-story'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait for user status to be determined
    }

    const isProtectedRoute = protectedRoutes.includes(pathname);

    if (!user && isProtectedRoute) {
      router.push('/login');
    } else if (user && pathname === '/login') {
      router.push('/');
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading && protectedRoutes.includes(pathname)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not logged in and it is a protected route, don't render children to avoid flash of content
  if (!user && protectedRoutes.includes(pathname)) {
    return null;
  }
  
  // If user is logged in and trying to access login page, don't render children
  if(user && pathname === '/login'){
    return null;
  }


  return <>{children}</>;
}
