
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
                <div className="relative flex flex-col flex-1 h-full">
                    <AppHeader />
                    <main className="flex-1 p-4 lg:p-6 mb-16 md:mb-0">
                        {children}
                    </main>
                    <MobileBottomNav />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
