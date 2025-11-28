'use client';

export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-b from-blue-50 to-white">
            <div className="mb-8">
                <Image
                    src="/assets/coinbox-ai.png"
                    alt="CoinBox Connect Hero"
                    width={600}
                    height={300}
                    className="rounded-lg shadow-xl"
                />
            </div>

            <h1 className="text-5xl font-bold text-blue-900 mb-4 text-center">
                Welcome to CoinBox Connect
            </h1>
            <p className="text-xl text-gray-700 mb-8 text-center max-w-2xl">
                Your ultimate peer-to-peer financial solution for secure trading, instant loans, and transparent marketplace.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 max-w-3xl">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-bold text-lg mb-2">🔒 Secure Trading</h3>
                    <p className="text-gray-600">Peer-to-peer trading with advanced security</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-bold text-lg mb-2">⚡ Instant Loans</h3>
                    <p className="text-gray-600">Quick access to financial services</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-bold text-lg mb-2">💰 Earn Commissions</h3>
                    <p className="text-gray-600">Refer friends and earn rewards</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-bold text-lg mb-2">🌐 Transparent Market</h3>
                    <p className="text-gray-600">Coin-based marketplace you can trust</p>
                </div>
            </div>

            <div className="flex gap-4 flex-wrap justify-center">
                <Button 
                    onClick={() => router.push('/auth')} 
                    size="lg"
                    className="transition-transform hover:scale-105"
                >
                    Sign In
                </Button>
                <Button 
                    variant="outline" 
                    onClick={() => router.push('/auth')} 
                    size="lg"
                    className="transition-transform hover:scale-105"
                >
                    Sign Up
                </Button>
                <Button 
                    variant="secondary" 
                    onClick={() => router.push('/dashboard')} 
                    size="lg"
                    className="transition-transform hover:scale-105"
                >
                    View Dashboard (Dev Mode)
                </Button>
            </div>
        </div>
    );
}
