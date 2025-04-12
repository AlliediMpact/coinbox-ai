'use client';

import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Coins,
  HelpCircle,
  Home as HomeIcon,
  Share2,
  Shield,
  Users,
  Wallet,
  PanelLeft,
  Bell,
  Cog,
  LogOut,
  User,
} from 'lucide-react';
import Image from 'next/image';
import {useAuth} from '@/components/AuthProvider';

interface HeaderProps {
  walletBalance: number;
  commissionBalance: number;
  searchTerm: string;
  handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
  searchResults: any[];
}

export const Header = ({walletBalance, commissionBalance, searchTerm, handleSearch, searchResults}: HeaderProps) => {
  const router = useRouter();
  const {user, signOutUser} = useAuth();

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center">
        <Image
          src="/CoinBoxLogo01.png"
          alt="CoinBox Logo"
          width={50}
          height={50}
          style={{cursor: 'pointer'}}
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
            <div className="absolute z-10 w-64 mt-1 bg-card rounded-md shadow-md">
              <ul className="py-1">
                {searchResults.map(result => (
                  <li
                    key={result.id}
                    className="px-4 py-2 hover:bg-secondary cursor-pointer"
                    onClick={() => router.push(result.link)}
                  >
                    {result.title}
                  </li>
                ))}
              </ul>
            </div>
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
  );
};

interface SidebarProps {
  onNavigate: (path: string) => void;
}

export const AppSidebar = ({onNavigate}: SidebarProps) => {
  return (
    <Sidebar>
      <SidebarTrigger/>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onNavigate('/dashboard')} tooltip="Home">
              <HomeIcon className="mr-2 h-4 w-4"/>
              <span>Home</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onNavigate('/dashboard/membership')} tooltip="Membership">
              <Users className="mr-2 h-4 w-4"/>
              <span>Membership</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onNavigate('/dashboard/trading')} tooltip="Coin Trading">
              <Coins className="mr-2 h-4 w-4"/>
              <span>Coin Trading</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onNavigate('/dashboard/wallet')} tooltip="Wallet">
              <Wallet className="mr-2 h-4 w-4"/>
              <span>Wallet</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onNavigate('/dashboard/risk')} tooltip="Risk Assessment">
              <Shield className="mr-2 h-4 w-4"/>
              <span>Risk Assessment</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onNavigate('/dashboard/referral')} tooltip="Referral Tracking">
              <Share2 className="mr-2 h-4 w-4"/>
              <span>Referral Tracking</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onNavigate('/dashboard/support')} tooltip="Support">
              <HelpCircle className="mr-2 h-4 w-4"/>
              <span>Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};
