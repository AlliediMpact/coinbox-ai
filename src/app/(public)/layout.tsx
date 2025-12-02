import type { Metadata } from 'next';
import './globals.css';
import { GeistSans, GeistMono } from 'geist/font';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Allied iMpact Coin Box',
  description: 'Your Secure Peer-to-Peer Financial Platform',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <ErrorBoundary>
          <ThemeProvider>
            <main className="flex-1">
              {children}
            </main>
            <SiteFooter />
            <Toaster />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
