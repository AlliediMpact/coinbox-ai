'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import HeroSection from '@/components/home/HeroSection';
import StatsCards from '@/components/home/StatsCards';
import LiveTransactionsFeed from '@/components/home/LiveTransactionsFeed';

export default function Home() {
    const router = useRouter();
    const { user, loading } = useAuth();

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (user && !loading) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen w-full">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-lg font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render home page content if user is authenticated (will redirect)
    if (user) {
        return null;
    }

    return (
        <main className="w-full min-h-screen overflow-x-hidden">
            {/* Skip to main content link for keyboard navigation */}
            <a 
                href="#hero-section" 
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
                Skip to main content
            </a>
            
            {/* Hero Section - Full width & height */}
            <div id="hero-section">
                <HeroSection />
            </div>

            {/* Stats Cards Section - Full width */}
            <StatsCards />

            {/* Live Transactions Feed - Full width */}
            <LiveTransactionsFeed />
        </main>
    );
}
