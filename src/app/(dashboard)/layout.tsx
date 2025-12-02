import type { Metadata } from 'next';
import '../globals.css';
import { GeistSans, GeistMono } from 'geist/font';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import HeaderSidebarLayout from '@/components/HeaderSidebar';
import PageTransition from '@/components/PageTransition';
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata: Metadata = {
  title: 'Allied iMpact Coin Box - Dashboard',
  description: 'Your Secure Peer-to-Peer Financial Platform',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <OnboardingProvider>
                <SidebarProvider>
                  <HeaderSidebarLayout>
                    <PageTransition>{children}</PageTransition>
                  </HeaderSidebarLayout>
                  <Toaster />
                </SidebarProvider>
              </OnboardingProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
