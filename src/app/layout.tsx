import type { Metadata } from 'next';
import { GeistSans, GeistMono } from 'geist/font'
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import HeaderSidebarLayout from '@/components/HeaderSidebar';
import PageTransition from '@/components/PageTransition';
import AppLoading from '@/components/AppLoading';
import RouteChangeIndicator from '@/components/RouteChangeIndicator';
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';
import dynamic from 'next/dynamic';

// Import UserOnboarding dynamically to avoid SSR issues
const UserOnboarding = dynamic(
  () => import('@/components/onboarding/UserOnboarding'),
  { ssr: false }
);

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
            <OnboardingProvider>
              <SidebarProvider>
                {/* Temporarily disabled loading screens for debugging */}
                {/* <AppLoading minimumLoadTimeMs={1000} /> */}
              
              {/* Enhanced Route Change Progress Indicator - for subsequent navigation */}
              {/* <RouteChangeIndicator /> */}
              
              <HeaderSidebarLayout>
                {/* Page Transitions for smooth content changes */}
                <PageTransition>
                  {children}
                </PageTransition>
              </HeaderSidebarLayout>
              <Toaster />
              {/* Temporarily disable UserOnboarding to avoid interaction issues; we'll re-enable after fixing it. */}
              {/* <UserOnboarding /> */}
              </SidebarProvider>
            </OnboardingProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

