
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { GeistSans } from 'geist/font/sans'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${GeistSans.variable}`}>
      <body>
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
