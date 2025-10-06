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

  // If loading, and not on an auth route, show a loader
  if (isUserLoading && !isAuthRoute) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If on an auth route (like /login), render children directly
  // This also handles the case where the user is not yet loaded but the route is public
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // If no user and we are on a protected route, we show a loader while redirecting
  if (!user && !isAuthRoute) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If user is logged in, and it's a protected route, render the app layout
  return (
    <SidebarProvider>
        <Sidebar>
            <AppSidebar />
        </Sidebar>
        <SidebarInset>
            <AppHeader />
            {children}
        </SidebarInset>
    </SidebarProvider>
  );
}
