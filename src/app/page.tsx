'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar, SidebarContent, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import SummaryComponent from "@/components/SummaryComponent";
import MembershipManagement from "@/components/MembershipManagement";
import CoinTrading from "@/components/CoinTrading";
import WalletManagement from "@/components/WalletManagement";
import RiskAssessmentTool from "@/components/RiskAssessmentTool";
import ReferralTracking from "@/components/ReferralTracking";
import AdminDashboard from "@/components/AdminDashboard";
import { Home as HomeIcon, Users, Coins, Wallet, Shield, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="flex h-screen">
      <Sidebar>
        <SidebarTrigger />
        <SidebarContent>
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
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <main className="flex-1 p-4">
        {user?.email === 'admin@example.com' ? (
          <AdminDashboard />
        ) : (
          // Default dashboard for a regular user
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <MembershipManagement />
            <CoinTrading />
            <WalletManagement />
            <RiskAssessmentTool userId={user?.uid || 'default'} />
            <ReferralTracking />
          </div>
        )}
        <SummaryComponent />
      </main>
    </div>
  );
}
