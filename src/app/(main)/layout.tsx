
'use client';

import { AppHeader } from '@/components/header';
import { MobileBottomNav } from '@/components/mobile-nav';
import { AppSidebar } from '@/components/nav';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useViewAs } from '@/hooks/use-view-as';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';


function ViewAsBanner() {
    const { viewAsRole, clearViewAs } = useViewAs();
    if (!viewAsRole) return null;

    return (
        <div className="bg-yellow-400 text-yellow-900 text-sm font-medium p-2 flex items-center justify-center gap-4">
            <AlertTriangle className="h-5 w-5" />
            <span>Viewing as a <strong>{viewAsRole}</strong>.</span>
            <Button
                variant="ghost"
                size="sm"
                className="hover:bg-yellow-500/50"
                onClick={clearViewAs}
            >
                <X className="mr-1 h-4 w-4" />
                Return to your own view
            </Button>
        </div>
    )
}

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
                    <ViewAsBanner />
                    <AppHeader />
                    <main className="flex-1 p-4 lg:p-6 mb-20 md:mb-0">
                        {children}
                    </main>
                    <MobileBottomNav />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

    