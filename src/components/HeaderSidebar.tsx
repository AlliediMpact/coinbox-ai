'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
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
    FileText,
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
import SiteFooter from '@/components/SiteFooter';

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
    const pathname = usePathname();
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
            label: 'Swap',
            icon: TrendingUp,
            href: '/dashboard/swap',
            description: 'Swap cryptocurrencies'
        },
        {
            label: 'P2P Trading',
            icon: Users,
            href: '/dashboard/p2p',
            description: 'Peer-to-peer trading'
        },
        {
            label: 'Wallet',
            icon: Wallet,
            href: '/dashboard/wallet',
            description: 'Manage your funds'
        },
        {
            label: 'Transactions',
            icon: FileText,
            href: '/dashboard/transactions',
            description: 'View transaction history'
        },
        {
            label: 'Receipts',
            icon: FileText,
            href: '/dashboard/receipts',
            description: 'View payment receipts'
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
        {
            label: 'Notifications',
            icon: Bell,
            href: '/dashboard/notifications',
            description: 'View your notifications'
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
            label: 'Analytics',
            icon: TrendingUp,
            href: '/dashboard/analytics',
            description: 'Platform analytics and reporting'
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

    // Track route type for header state
    const isHomePage = pathname === '/';
    const isAuthPage = pathname.startsWith('/auth');

    // Logged-out public pages (home + auth) use a simple header + content layout
    // This keeps a single header component with two visual states while avoiding
    // the dashboard sidebar shell on marketing/auth pages.
    if ((isHomePage || isAuthPage) && !user) {
        return (
            <div className="flex flex-col min-h-screen bg-background w-full overflow-x-hidden">
                {/* Marketing-style header for public pages (logged-out state) */}
                <header className="w-full border-b" style={{ backgroundColor: '#193281' }}>
                    <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                        {/* Logo */}
                        <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
                            <Image
                                src="/assets/coinbox-ai.png"
                                alt="CoinBox Logo"
                                width={40}
                                height={40}
                                className="rounded-full"
                            />
                            <span className="ml-2 text-lg font-bold text-white hidden sm:inline-block">
                                CoinBox
                            </span>
                        </div>

                        {/* Logged-out header actions */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-white/30 text-white hover:bg-white/10"
                                onClick={() => router.push('/auth')}
                            >
                                Sign In
                            </Button>
                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                                onClick={() => router.push('/auth/signup')}
                            >
                                Get Started
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 w-full min-w-0 overflow-x-hidden pt-0">
                    {children}
                </main>

                <SiteFooter />
            </div>
        );
    }

    // Authenticated / dashboard pages use full header + sidebar shell
    return (
        <div className="flex flex-col min-h-screen bg-background w-full overflow-x-hidden">
            {/* Unified Header: marketing-style layout with dashboard color */}
            <header className="sticky top-0 z-50 w-full border-b shadow-sm" style={{ backgroundColor: '#193281' }}>
                <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Mobile Menu Button */}
                    <div>
                        <Button
                            variant="ghost"
                            className="mr-2 px-2 text-white hover:bg-white/10 lg:hidden"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </Button>
                    </div>

                        {/* Logo */}
                        <div className="flex items-center cursor-pointer" onClick={() => router.push('/dashboard')}>
                            <Image
                                src="/assets/coinbox-ai.png"
                                alt="CoinBox Logo"
                                width={40}
                                height={40}
                                className="rounded-full"
                            />
                            <span className="ml-2 text-lg font-bold text-white hidden sm:inline-block">
                                CoinBox
                            </span>
                        </div>                    {/* Right Section: logged-out vs logged-in */}
                    <div className="flex items-center gap-3 ml-auto">
                        {!user && (
                            // Logged-out header actions
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-white/30 text-white hover:bg-white/10"
                                    onClick={() => router.push('/auth')}
                                >
                                    Sign In
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                                    onClick={() => router.push('/auth/signup')}
                                >
                                    Get Started
                                </Button>
                            </div>
                        )}

                        {user && (
                            // Logged-in header: balances, notifications, avatar menu
                            <>
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

                                <ReferralNotifier />

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
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Sidebar and Content */}
            <div className="flex flex-1 w-full overflow-x-hidden">
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
                            x: isMobileMenuOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024) ? -320 : 0
                        }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 300, 
                            damping: 30 
                        }}
                        className="fixed inset-y-0 left-0 z-40 w-64 shadow-lg lg:shadow-none lg:static lg:inset-auto overflow-y-auto"
                        style={{ backgroundColor: '#193281' }}
                    >
                    <nav className="mt-16 lg:mt-0 p-4 space-y-2">
                        {/* Regular navigation items */}
                        {navigationItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
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
                                                className={cn(
                                                    "w-full justify-start text-white",
                                                    isActive && "bg-white/20 font-semibold"
                                                )}
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
                        )})}


                        {/* Admin section */}
                        {isAdmin && (
                            <>
                                <div className="pt-4 pb-2">
                                    <p className="text-xs font-semibold text-gray-400 uppercase pl-2">Admin Tools</p>
                                    <div className="mt-1 h-px bg-gray-400/20" />
                                </div>
                                
                                {adminNavigationItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
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
                                                        className={cn(
                                                            "w-full justify-start text-white",
                                                            isActive && "bg-white/20 font-semibold"
                                                        )}
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
                                )})}

                            </>
                        )}
                    </nav>
                    </motion.aside>
                </AnimatePresence>

                {/* Main Content */}
                <main 
                    className="flex-1 p-4 w-full min-w-0 overflow-x-hidden flex flex-col"
                >
                    <div className="flex-1">
                        {children}
                    </div>
                    
                    {/* Site Footer */}
                    <SiteFooter />
                </main>
            </div>
        </div>
    );
};

export default HeaderSidebar;
