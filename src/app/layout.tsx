import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Omuto Central',
  description: 'The master tool for Omuto Foundation staff.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="">
      <body
        className={cn(
          'font-body antialiased',
          inter.variable,
          GeistSans.variable,
        )}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
