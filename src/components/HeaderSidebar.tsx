'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
    X,
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
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
    const [isAdmin, setIsAdmin] = useState(false);

    // Effect to fetch user data
    useEffect(() => {
        const checkUserAccess = async () => {
            if (user) {
                try {
                    const db = getFirestore();
                    // Check wallet balance
                    const walletDoc = await getDoc(doc(db, "wallets", user.uid));
                    if (walletDoc.exists()) {
                        setWalletBalance(walletDoc.data().balance || '0.00');
                    }
                    
                    // Check if user is admin
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserMembership(userData.membershipTier || 'Basic');
                        
                        // Check if user has admin role
                        if (userData.role === 'admin' || userData.role === 'support') {
                            setIsAdmin(true);
                        }
                    }
                } catch (error) {
                    console.error("Error checking user access:", error);
                }
            }
        };
        
        checkUserAccess();
    }, [user]);

    // Regular user navigation items
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
            label: 'Disputes',
            icon: AlertCircle,
            href: '/dashboard/disputes',
            description: 'Manage trade disputes'
        },
        {
            label: 'Security',
            icon: Shield,
            href: '/dashboard/security',
            description: 'Monitor account security'
        },
        {
            label: 'Risk Assessment',
            icon: BadgeAlert,
            href: '/dashboard/risk',
            description: 'Review risk status'
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

    // Admin navigation items
    const adminNavigationItems = [
        {
            label: 'Admin Dashboard',
            icon: Users,
            href: '/dashboard/admin',
            description: 'Admin control panel'
        },
        {
            label: 'Transaction Monitoring',
            icon: Shield,
            href: '/dashboard/admin/transaction-monitoring',
            description: 'Monitor suspicious transactions'
        },
        {
            label: 'Dispute Management',
            icon: AlertCircle,
            href: '/dashboard/admin/disputes',
            description: 'Manage user disputes'
        },
        {
            label: 'User Management',
            icon: UserIcon,
            href: '/dashboard/admin/users',
            description: 'Manage platform users'
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b shadow-sm" style={{ backgroundColor: '#193281' }}>
                <div className="container flex h-16 items-center px-4">
                    {/* Mobile Menu Button */}
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button
                            variant="ghost"
                            className="mr-2 px-2 text-white hover:opacity-80 lg:hidden"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <motion.div
                                animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {isMobileMenuOpen ? (
                                    <motion.div
                                        initial={{ opacity: 0, rotate: 90 }}
                                        animate={{ opacity: 1, rotate: 0 }}
                                    >
                                        <X className="h-6 w-6" />
                                    </motion.div>
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </motion.div>
                        </Button>
                    </motion.div>

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
                {/* Mobile Menu Backdrop */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-30 bg-black lg:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    )}
                </AnimatePresence>
                
                {/* Sidebar */}
                <AnimatePresence>
                    <motion.aside
                        initial={{ x: -320 }}
                        animate={{ 
                            x: isMobileMenuOpen ? 0 : window?.innerWidth < 1024 ? -320 : 0
                        }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 300, 
                            damping: 30 
                        }}
                        className="fixed inset-y-0 left-0 z-40 w-64 shadow-lg lg:shadow-none lg:static lg:inset-auto"
                        style={{ backgroundColor: '#193281' }}
                    >
                    <nav className="mt-16 lg:mt-0 p-4 space-y-2">
                        {/* Regular navigation items */}
                        {navigationItems.map((item) => (
                            <motion.div
                                key={item.href}
                                whileHover={{ 
                                    x: 5, 
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                }}
                                whileTap={{ scale: 0.98 }}
                                className="rounded-md overflow-hidden"
                            >
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start text-white"
                                                onClick={() => {
                                                    router.push(item.href);
                                                    setIsMobileMenuOpen(false);
                                                }}
                                            >
                                                <item.icon className="mr-2 h-4 w-4" />
                                                <span>{item.label}</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            <p>{item.description}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </motion.div>
                        ))}

                        {/* Admin section */}
                        {isAdmin && (
                            <>
                                <div className="pt-4 pb-2">
                                    <p className="text-xs font-semibold text-gray-400 uppercase pl-2">Admin Tools</p>
                                    <div className="mt-1 h-px bg-gray-400/20" />
                                </div>
                                
                                {adminNavigationItems.map((item) => (
                                    <motion.div
                                        key={item.href}
                                        whileHover={{ 
                                            x: 5, 
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                        className="rounded-md overflow-hidden"
                                    >
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start text-white"
                                                        onClick={() => {
                                                            router.push(item.href);
                                                            setIsMobileMenuOpen(false);
                                                        }}
                                                    >
                                                        <item.icon className="mr-2 h-4 w-4" />
                                                        <span>{item.label}</span>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right">
                                                    <p>{item.description}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </motion.div>
                                ))}
                            </>
                        )}
                    </nav>
                    </motion.aside>
                </AnimatePresence>

                {/* Main Content */}
                <motion.main 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 p-4"
                >
                    {children}
                </motion.main>
            </div>
        </div>
    );
};

export default HeaderSidebar;
