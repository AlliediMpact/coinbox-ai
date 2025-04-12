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

export default function Home() {
  const { user, signOutUser } = useAuth();
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState(0);
  const [commissionBalance, setCommissionBalance] = useState(0);
    useEffect(() => {
        // Mock data for demonstration
        setWalletBalance(1800);
        setCommissionBalance(500);
    }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
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
                />
                <h1 className="text-3xl font-bold ml-2">CoinBox Connect</h1>
            </div>
             {user ? (
                    <div className="flex items-center space-x-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80">
                                    My Wallet: R{walletBalance}
                                </button>
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
                                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80">
                                    My Profile
                                </button>
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
                                    router.push('/auth');
                                }}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ) : (
                    <div className="space-x-4">
                        <button
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80"
                            onClick={() => router.push('/auth')}
                        >
                            Sign Up
                        </button>
                        <button
                            className="px-4 py-2 border rounded-md hover:bg-secondary hover:text-secondary-foreground"
                            onClick={() => router.push('/auth')}
                        >
                            Login
                        </button>
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
             <KycVerification/>
             <CommissionTracking/>
          </div>
        )}
        <SummaryComponent />
      </main>
    </div>
  );
}
