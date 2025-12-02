'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import HeroSection from '@/components/home/HeroSection';
import StatsCards from '@/components/home/StatsCards';
import LiveTransactionsFeed from '@/components/home/LiveTransactionsFeed';
import HowItWorks from '@/components/home/HowItWorks';
import TrustStrip from '@/components/home/TrustStrip';
import WhyCoinBox from '@/components/home/WhyCoinBox';
import BottomCTA from '@/components/home/BottomCTA';

export default function Home() {
    const router = useRouter();
    const { user, loading } = useAuth();

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (user && !loading) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    // If user is authenticated, show redirect message
    if (user) {
        return (
            <div className="flex items-center justify-center min-h-screen w-full">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-lg font-medium">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    // Always show content - no waiting
    return (
        <>
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

            {/* How it works */}
            <HowItWorks />

            {/* Stats Cards Section - Full width */}
            <StatsCards />

            {/* Security & Trust Strip */}
            <TrustStrip />

            {/* Live Transactions Feed - Full width */}
            <LiveTransactionsFeed />

            {/* Why CoinBox - brief highlights */}
            <WhyCoinBox />

            {/* Bottom CTA */}
            <BottomCTA />
        </>
    );
}
