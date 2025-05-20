'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Home as HomeIcon,
    User as UserIcon,
    Coins,
    Wallet,
    Shield,
    Share2,
    HelpCircle,
    Menu,
    Search,
    Settings,
    LogOut,
    TrendingUp,
    AlertCircle,
    Users,
    BadgeCheck,
    BadgeAlert,
    PiggyBank,
    HandCoins,
    Bell,
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from '@/components/AuthProvider';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { getMembershipTier, formatCurrency } from '@/lib/membership-tiers';
import { ReferralNotifier } from '@/components/referral/ReferralNotifier';

interface HeaderProps {
    walletBalance: number | string;
    commissionBalance: number | string;
    searchTerm: string;
    onSearch: (term: string) => void;
    notifications: Array<{
        id: string;
        type: 'transaction' | 'system' | 'alert';
        message: string;
        read: boolean;
    }>;
}

const HeaderSidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [walletBalance, setWalletBalance] = useState('0.00');
    const [commissionBalance, setCommissionBalance] = useState('0.00');
    const [notifications, setNotifications] = useState([]);
    const [userMembership, setUserMembership] = useState<string>('Basic');

    // Effect to fetch user data
    useEffect(() => {
        if (user) {
            // Fetch wallet balance, commission balance, and notifications
            // This will be implemented when we work on the wallet feature
        }
    }, [user]);

    const navigationItems = [
        {
            label: 'Dashboard',
            icon: HomeIcon,
            href: '/dashboard',
            description: 'Overview of your account'
        },
        {
            label: 'Coin Trading',
            icon: Coins,
            href: '/dashboard/trading',
            description: 'Buy and sell coins'
        },
        {
            label: 'Wallet',
            icon: Wallet,
            href: '/dashboard/wallet',
            description: 'Manage your funds'
        },
        {
            label: 'Risk Assessment',
            icon: Shield,
            href: '/dashboard/risk',
            description: 'Review security status'
        },
        {
            label: 'Referrals',
            icon: Share2,
            href: '/dashboard/referral',
            description: 'Manage your referrals'
        },
        {
            label: 'Support',
            icon: HelpCircle,
            href: '/dashboard/support',
            description: '24/7 customer support'
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b shadow-sm" style={{ backgroundColor: '#193281' }}>
                <div className="container flex h-16 items-center px-4">
                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        className="mr-2 px-2 text-white hover:opacity-80 lg:hidden"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <Menu className="h-6 w-6" />
                    </Button>

                    {/* Logo */}
                    <div className="flex items-center">
                        <Image
                            src="/assets/coinbox-ai.png"
                            alt="CoinBox Logo"
                            width={40}
                            height={40}
                            className="rounded-full"
                        />
                        <span className="ml-2 text-lg font-bold text-white hidden sm:inline-block">
                            CoinBox Connect
                        </span>
                    </div>

                    {/* Search Bar */}
                    <div className="hidden md:flex mx-4 flex-1 max-w-md">
                        <div className="relative w-full">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                type="search"
                                placeholder="Search..."
                                className="w-full pl-8 bg-white/10 text-white placeholder:text-gray-300"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="ml-auto flex items-center space-x-4">
                        {/* Balances */}
                        <div className="hidden md:flex space-x-4">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className="flex items-center text-white">
                                            <Wallet className="h-4 w-4 mr-1" />
                                            <span>{formatCurrency(typeof walletBalance === 'string' ? parseFloat(walletBalance) : walletBalance)}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Wallet Balance</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className="flex items-center" style={{ color: '#cb6ce6' }}>
                                            <Share2 className="h-4 w-4 mr-1" />
                                            <span>{formatCurrency(typeof commissionBalance === 'string' ? parseFloat(commissionBalance) : commissionBalance)}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Commission Balance</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {/* Referral Notifications */}
                        <ReferralNotifier />

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="relative h-8 w-8 rounded-full bg-primary-dark text-white"
                                >
                                    {user?.email?.[0]?.toUpperCase() || 'U'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <div className="flex items-center justify-start gap-2 p-2">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{user?.email}</p>
                                        <p className="text-xs text-muted-foreground">{userMembership}</p>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/dashboard/membership')}>
                                    <BadgeCheck className="mr-2 h-4 w-4" />
                                    <span>Membership</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-500 focus:text-red-500"
                                    onClick={() => signOut()}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Sidebar and Content */}
            <div className="flex">
                {/* Sidebar */}
                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:w-64",
                        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                    style={{ backgroundColor: '#193281' }}
                >
                    <nav className="mt-16 lg:mt-0 p-4 space-y-2">
                        {navigationItems.map((item) => (
                            <Button
                                key={item.href}
                                variant="ghost"
                                className="w-full justify-start text-white hover:opacity-80"
                                onClick={() => {
                                    router.push(item.href);
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                <span>{item.label}</span>
                            </Button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4">{children}</main>
            </div>
        </div>
    );
};

export default HeaderSidebar;
