import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseProvider } from '@/firebase/provider';
import { AuthProvider } from '@/components/auth-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'Omuto Central',
  description: 'The master tool for Omuto Foundation staff.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          'font-body antialiased',
          inter.variable,
          spaceGrotesk.variable
        )}
      >
        <FirebaseProvider>
          <AuthProvider>{children}</AuthProvider>
        </FirebaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
