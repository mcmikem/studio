'use client';

import { MobileBottomNav } from '@/components/mobile-nav';
import { AppSidebar } from '@/components/nav';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ViewAsBanner } from '@/components/view-as-banner';
import { AppHeader } from '@/components/header';


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
                    <ViewAsBanner />
                    <main className="flex-1 p-4 lg:p-6 mb-20 md:mb-0 overflow-y-auto">
                        {children}
                    </main>
                    <MobileBottomNav />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
