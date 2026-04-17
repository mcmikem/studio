import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Space_Grotesk } from 'next/font/google';
import { AppSidebar } from '@/components/nav';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/header';
import { MobileBottomNav } from '@/components/mobile-nav';
import { ViewAsBanner } from '@/components/view-as-banner';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { GlobalBackButton } from '@/components/global-back-button';
import { CheckinReminderToast } from '@/components/reminders/checkin-reminder-toast';
import { RoleTour } from '@/components/role-tour';
import { CommandPalette } from '@/components/command-palette';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import { FloatingAIButton } from '@/components/floating-ai-button';

const inter = Inter({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        <meta name="theme-color" content="#F9F8F3" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Omuto" />
        <meta name="application-name" content="Omuto Central" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <title>Omuto Central</title>
        <meta
          name="description"
          content="The master tool for Omuto Foundation staff."
        />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var theme = localStorage.getItem('theme');
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else if (theme === 'light') {
              document.documentElement.classList.remove('dark');
            }
          })();
        `}} />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <Providers>
          <FirebaseErrorListener />
          <CheckinReminderToast />
          <RoleTour />
          <FloatingAIButton />
          <SidebarProvider>
            <Sidebar>
              <AppSidebar />
            </Sidebar>
            <SidebarInset className="min-h-screen flex flex-col">
              <div className="relative flex flex-col flex-1">
                <AppHeader />
                <ViewAsBanner />
                <main className="flex-1 w-full max-w-full overflow-x-hidden px-2 sm:px-4 py-3 sm:py-4 lg:py-6 pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px))] md:pb-6">
                  <GlobalBackButton />
                  <Breadcrumbs />
                  {children}
                </main>
                <MobileBottomNav />
              </div>
            </SidebarInset>
          </SidebarProvider>
        </Providers>
        <Toaster />
        <CommandPalette />
      </body>
    </html>
  );
}
