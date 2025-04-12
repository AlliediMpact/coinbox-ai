'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar, SidebarContent, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import SummaryComponent from "@/components/SummaryComponent";
import { Home as HomeIcon, Users, Coins, Wallet, Shield, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminDashboard from "@/components/AdminDashboard";
import Image from 'next/image';

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
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <main className="flex-1 p-4">
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
          </div>
        )}
        <SummaryComponent />
      </main>
    </div>
  );
}

// Create separate component files for each of these components
function MembershipComponent() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Membership Management</h1>
    </div>
  );
}

function CoinTradingComponent() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Coin Trading</h1>
    </div>
  );
}

function WalletComponent() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Wallet Management</h1>
    </div>
  );
}

interface RiskAssessmentComponentProps {
  userId: string;
}

function RiskAssessmentComponent({ userId }: RiskAssessmentComponentProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Risk Assessment Tool</h1>
    </div>
  );
}

function ReferralTrackingComponent() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Referral Tracking</h1>
    </div>
  );
}
function SupportComponent() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Support</h1>
    </div>
  );
}

