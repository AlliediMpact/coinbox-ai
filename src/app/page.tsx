'use client';

export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
    const router = useRouter();

    return (
        <main className="flex flex-col items-center justify-center min-h-screen px-4 py-12 sm:px-6 md:px-8 lg:py-16 bg-gradient-to-b from-blue-50 to-white">
            {/* Skip to main content link for keyboard navigation */}
            <a 
                href="#main-content" 
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
                Skip to main content
            </a>
            
            {/* Hero Image Section */}
            <div id="main-content" className="mb-8 md:mb-12 w-full max-w-2xl">
                <Image
                    src="/assets/coinbox-ai.png"
                    alt="CoinBox Connect - Secure peer-to-peer financial platform logo"
                    width={600}
                    height={300}
                    className="rounded-lg shadow-xl w-full h-auto"
                    priority
                />
            </div>

            {/* Hero Text Section */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-blue-900 mb-4 md:mb-6 text-center max-w-4xl leading-tight px-4">
                Welcome to CoinBox Connect
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-8 md:mb-12 text-center max-w-2xl px-4 leading-relaxed">
                Your ultimate peer-to-peer financial solution for secure trading, instant loans, and transparent marketplace.
            </p>

            {/* Feature Cards Section */}
            <section aria-label="Platform Features" className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-10 md:mb-12 w-full max-w-4xl px-4">
                <article className="bg-white p-5 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <h3 className="font-bold text-lg md:text-xl mb-2 text-blue-900">
                        <span aria-hidden="true">🔒</span> <span className="sr-only">Lock icon:</span>Secure Trading
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                        Peer-to-peer trading with advanced security
                    </p>
                </article>
                <article className="bg-white p-5 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <h3 className="font-bold text-lg md:text-xl mb-2 text-blue-900">
                        <span aria-hidden="true">⚡</span> <span className="sr-only">Lightning icon:</span>Instant Loans
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                        Quick access to financial services
                    </p>
                </article>
                <article className="bg-white p-5 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <h3 className="font-bold text-lg md:text-xl mb-2 text-blue-900">
                        <span aria-hidden="true">💰</span> <span className="sr-only">Money bag icon:</span>Earn Commissions
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                        Refer friends and earn rewards
                    </p>
                </article>
                <article className="bg-white p-5 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <h3 className="font-bold text-lg md:text-xl mb-2 text-blue-900">
                        <span aria-hidden="true">🌐</span> <span className="sr-only">Globe icon:</span>Transparent Market
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                        Coin-based marketplace you can trust
                    </p>
                </article>
            </section>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 flex-wrap justify-center w-full max-w-lg px-4">
                <Button 
                    onClick={() => router.push('/auth')} 
                    size="lg"
                    className="w-full sm:w-auto sm:flex-1 transition-transform hover:scale-105"
                    aria-label="Sign in to your CoinBox account"
                >
                    Sign In
                </Button>
                <Button 
                    variant="outline" 
                    onClick={() => router.push('/auth')} 
                    size="lg"
                    className="w-full sm:w-auto sm:flex-1 transition-transform hover:scale-105"
                    aria-label="Create a new CoinBox account"
                >
                    Sign Up
                </Button>
            </div>
            
            {/* Development Mode Link */}
            {process.env.NODE_ENV === 'development' && (
                <Button 
                    variant="secondary" 
                    onClick={() => router.push('/dashboard')}
                    size="lg"
                    className="mt-4 transition-transform hover:scale-105"
                    aria-label="View dashboard in development mode"
                >
                    View Dashboard (Dev Mode)
                </Button>
            )}
        </main>
    );
}
