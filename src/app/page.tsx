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
            { id: 1, title: "Trading Guide", link: "/trading/guide" },
            { id: 2, title: "Wallet FAQs", link: "/wallet/faq" },
            { id: 3, title: "Referral Program Details", link: "/referral/details" },
        ];

        // Filter mock results based on search term
        const filteredResults = mockResults.filter(result =>
            result.title.toLowerCase().includes(event.target.value.toLowerCase())
        );

        setSearchResults(filteredResults);
    };

    return (
        <>
            <div className="flex h-screen">
                <Sidebar>
                    <SidebarTrigger />
                    <SidebarContent>
                        <div className="flex justify-center p-4">
                            <Image
                                src="/CoinBoxLogo02.png"
                                alt="CoinBox Logo"
                                width={100}
                                height={100}
                                style={{ cursor: 'pointer' }}
                                onClick={() => router.push('/')}
                            />
                        </div>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => handleNavigation('/dashboard')} tooltip="Home" >
                                    <HomeIcon className="mr-2 h-4 w-4" />
                                    <span>Home</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => handleNavigation('/dashboard/membership')} tooltip="Membership">
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>Membership</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => handleNavigation('/dashboard/trading')} tooltip="Coin Trading">
                                    <Coins className="mr-2 h-4 w-4" />
                                    <span>Coin Trading</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => handleNavigation('/dashboard/wallet')} tooltip="Wallet">
                                    <Wallet className="mr-2 h-4 w-4" />
                                    <span>Wallet</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => handleNavigation('/dashboard/risk')} tooltip="Risk Assessment">
                                    <Shield className="mr-2 h-4 w-4" />
                                    <span>Risk Assessment</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => handleNavigation('/dashboard/referral')} tooltip="Referral Tracking">
                                    <Share2 className="mr-2 h-4 w-4" />
                                    <span>Referral Tracking</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => handleNavigation('/dashboard/support')} tooltip="Support">
                                    <HelpCircle className="mr-2 h-4 w-4" />
                                    <span>Support</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarContent>
                </Sidebar>
                <main className="flex-1 p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                            <Image
                                src="/CoinBoxLogo01.png"
                                alt="CoinBox Logo"
                                width={50}
                                height={50}
                                style={{ cursor: 'pointer' }}
                                onClick={() => router.push('/')}
                            />
                            <div className="w-64 ml-4">
                                <Input
                                    type="search"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                />
                                {searchTerm && searchResults.length > 0 && (
                                    <Card className="absolute z-10 w-64 mt-1">
                                        <CardContent className="p-2">
                                            <ul>
                                                {searchResults.map(result => (
                                                    <li key={result.id} className="p-1 hover:bg-secondary cursor-pointer" onClick={() => router.push(result.link)}>
                                                        {result.title}
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger>
                                        <Button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80">
                                            My Wallet: R{walletBalance}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                        <DropdownMenuItem>
                                            My Commission: R{commissionBalance}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push('/dashboard/wallet')}>
                                            Buy Coins
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push('/dashboard/wallet')}>
                                            Transaction History
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                                            Settings
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger>
                                        <Button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80">
                                            My Profile
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                        <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                                            My Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push('/dashboard/notifications')}>
                                            Notifications
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                                            Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                            signOutUser();
                                            router.push('/auth')
                                        }}>
                                            Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ) : (
                            <div className="space-x-4">
                                <Button
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80"
                                    onClick={() => router.push('/auth')}
                                >
                                    Sign Up
                                </Button>
                                <Button
                                    className="px-4 py-2 border rounded-md hover:bg-secondary hover:text-secondary-foreground"
                                    onClick={() => router.push('/auth')}
                                >
                                    Login
                                </Button>
                            </div>
                        )}
                    </div>
                    {user?.email === 'admin@example.com' ? (
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
                    )}
                    <SummaryComponent />
                </main>
            </div>
        </>
    );
}

