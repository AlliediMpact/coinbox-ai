import type { Metadata } from 'next';
import { GeistSans, GeistMono } from 'geist/font'
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import HeaderSidebarLayout from '@/components/HeaderSidebar';

export const metadata: Metadata = {
  title: 'Allied iMpact Coin Box',
  description: 'Your Secure Peer-to-Peer Financial Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <SidebarProvider>
              <HeaderSidebarLayout>
                {children}
              </HeaderSidebarLayout>
              <Toaster />
            </SidebarProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

