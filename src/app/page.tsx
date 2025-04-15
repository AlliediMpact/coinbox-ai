'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar, SidebarContent, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import SummaryComponent from "@/components/SummaryComponent";
import { Home as HomeIcon, Users, Coins, Wallet, Shield, Share2, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminDashboard from "@/components/AdminDashboard";
import Image from 'next/image';
import MembershipComponent from "@/components/MembershipComponent";
import CoinTradingComponent from "@/components/CoinTradingComponent";
import WalletComponent from "@/components/WalletComponent";
import RiskAssessmentComponent from "@/components/RiskAssessmentComponent";
import ReferralTrackingComponent from "@/components/ReferralTrackingComponent";
import SupportComponent from "@/components/SupportComponent";
import KycVerification from "@/components/KycVerification";
import CommissionTracking from "@/components/CommissionTracking";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from 'react';
import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HeaderSidebarLayout from "@/components/HeaderSidebar";

const HomePageContent = () => {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-12">
            {/* Hero Image */}
            <Image
                src="/assets/hero-image.jpg" // Replace with your actual image path
                alt="CoinBox Connect Hero"
                width={1200}
                height={600}
                className="rounded-lg shadow-xl mb-8"
            />

            <h1 className="text-4xl font-bold text-white mb-4">Welcome to CoinBox Connect</h1>
            <p className="text-lg text-gray-300 mb-8">Your ultimate peer-to-peer financial solution.</p>

            {/* Key Benefits */}
            <ul className="text-white text-lg list-disc list-inside mb-8">
                <li>Secure Peer-to-Peer Trading</li>
                <li>Instant Loan Access</li>
                <li>Earn Referral Commissions</li>
                <li>Transparent Coin-Based Marketplace</li>
            </ul>

            {/* Authentication Buttons */}
            <div className="space-x-4">
                <Button onClick={() => router.push('/auth')} className="transition-transform hover:scale-105">
                    Sign In
                </Button>
                <Button variant="outline" onClick={() => router.push('/auth')} className="transition-transform hover:scale-105">
                    Sign Up
                </Button>
            </div>
        </div>
    );
};

export default function Home() {
    const { user, signOutUser } = useAuth();
    const router = useRouter();
    const [walletBalance, setWalletBalance] = useState(0);
    const [commissionBalance, setCommissionBalance] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    useEffect(() => {
        // Mock data for demonstration
        setWalletBalance(1800);
        setCommissionBalance(500);
    }, []);

    const handleNavigation = (path: string) => {
        router.push(path);
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        // Mock data for search results
        const mockResults = [
            { id: 1, title: "Trading Guide", link: "/dashboard/trading" },
            { id: 2, title: "Wallet FAQs", link: "/dashboard/wallet" },
            { id: 3, title: "Referral Program Details", link: "/dashboard/referral" },
        ];

        // Filter mock results based on search term
        const filteredResults = mockResults.filter(result =>
            result.title.toLowerCase().includes(event.target.value.toLowerCase())
        );

        setSearchResults(filteredResults);
    };

    return (
        
           <HeaderSidebarLayout>
            {user ? (
                user.email === 'admin@example.com' ? (
                    <AdminDashboard />
                ) : (
                    // Default dashboard for a regular user
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        <MembershipComponent />
                        <CoinTradingComponent />
                        <WalletComponent />
                        <RiskAssessmentComponent userId={user?.uid || 'default'} />
                        <ReferralTrackingComponent />
                        <SupportComponent />
                        <KycVerification />
                        <CommissionTracking />
                    </div>
                )
            ) : (
                // Landing page content for non-logged-in users
                 <HomePageContent />
            )}
            <SummaryComponent />
         </HeaderSidebarLayout>
        
    );
}
