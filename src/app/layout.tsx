
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { GeistSans } from 'geist/font/sans'
import { Inter, Space_Grotesk } from 'next/font/google'
import { AppSidebar } from '@/components/nav';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/header';
import { MobileBottomNav } from '@/components/mobile-nav';
import { ViewAsBanner } from '@/components/view-as-banner';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

const inter = Inter({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${GeistSans.variable}`}>
      <body>
        <Providers>
           <FirebaseErrorListener />
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
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
