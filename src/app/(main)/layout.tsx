
'use client';

import { AppHeader } from '@/components/header';
import { MobileBottomNav } from '@/components/mobile-nav';
import { AppSidebar } from '@/components/nav';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <Sidebar>
                <AppSidebar />
            </Sidebar>
            <SidebarInset>
                <AppHeader />
                 <main className="p-4 lg:p-6 h-full flex flex-col mb-16 md:mb-0">
                    {children}
                </main>
                 <MobileBottomNav />
            </SidebarInset>
        </SidebarProvider>
    );
}
