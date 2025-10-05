'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/header';
import { AppSidebar } from '@/components/nav';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

const unprotectedRoutes = ['/login'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return; // Wait for user status

    const isUnprotected = unprotectedRoutes.includes(pathname);

    if (!user && !isUnprotected) {
      router.push('/login');
    }
    if (user && isUnprotected) {
      router.push('/');
    }
  }, [user, isUserLoading, router, pathname]);

  const isAuthRoute = unprotectedRoutes.includes(pathname);

  if (isUserLoading && !isAuthRoute) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (!user && !isAuthRoute) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>{children}</>
  );
}
