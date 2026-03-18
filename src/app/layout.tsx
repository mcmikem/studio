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
import { CheckinReminderToast } from '@/components/reminders/checkin-reminder-toast';

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
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <title>Omuto Central</title>
        <meta
          name="description"
          content="The master tool for Omuto Foundation staff."
        />
      </head>
      <body>
        <Providers>
          <FirebaseErrorListener />
          <CheckinReminderToast />
          <SidebarProvider>
            <Sidebar>
              <AppSidebar />
            </Sidebar>
            <SidebarInset className="min-h-screen flex flex-col">
              <div className="relative flex flex-col flex-1">
                <AppHeader />
                <ViewAsBanner />
                <main className="flex-1 w-full max-w-full overflow-x-hidden px-2 sm:px-4 py-3 sm:py-4 lg:py-6 pb-32 md:pb-6">
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
