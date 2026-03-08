import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { GeistSans } from 'geist/font/sans';
import { Inter, Space_Grotesk } from 'next/font/google';
import { AppSidebar } from '@/components/nav';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/header';
import { MobileBottomNav } from '@/components/mobile-nav';
import { ViewAsBanner } from '@/components/view-as-banner';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { GlobalBackButton } from '@/components/global-back-button';

const inter = Inter({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${GeistSans.variable}`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111827" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <title>Omuto Central</title>
        <meta
          name="description"
          content="The master tool for Omuto Foundation staff."
        />
      </head>
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
                <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4 lg:px-6 lg:py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6">
                  <GlobalBackButton />
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
