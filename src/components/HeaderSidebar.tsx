'use client';

import React, { useState, useEffect } from 'react';
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
import { Skeleton } from "@/components/ui/skeleton";
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
    Moon,
    Sun,
    Plus,
    ArrowUpRight,
    ChevronRight,
    CreditCard,
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
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import SiteFooter from '@/components/SiteFooter';
import PublicHeader from '@/components/PublicHeader';
import Logo from '@/components/Logo';
import { useNotifications } from '@/hooks/use-notifications';
import { useTheme } from '@/contexts/ThemeContext';
import { ScrollArea } from "@/components/ui/scroll-area";

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
    const [showSearch, setShowSearch] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [walletBalance, setWalletBalance] = useState('0.00');
    const [commissionBalance, setCommissionBalance] = useState('0.00');
    const [userMembership, setUserMembership] = useState<string>('Basic');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { theme, setTheme, effectiveTheme } = useTheme();

    const isDashboardRoute = !!pathname && pathname.startsWith('/dashboard');
    
    // Use notifications hook
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications({
        status: 'unread',
        limit: 5
    });

    // Effect to fetch user data
    useEffect(() => {
        const checkUserAccess = async () => {
            if (user) {
                setIsLoading(true);
                try {
                    const db = getFirestore();
                    // Check wallet balance
                    const walletDoc = await getDoc(doc(db, "wallets", user.uid));
                    if (walletDoc.exists()) {
                        setWalletBalance(walletDoc.data().balance || '0.00');
                    }
                    
                    // Check commission balance
                    const commissionDoc = await getDoc(doc(db, "commissions", user.uid));
                    if (commissionDoc.exists()) {
                        setCommissionBalance(commissionDoc.data().balance || '0.00');
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
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };
        
        checkUserAccess();
    }, [user]);

    // Public shell for non-dashboard routes: keep layout simple
    if (!isDashboardRoute) {
        return (
            <div className="min-h-screen flex flex-col bg-background w-full">
                <PublicHeader />
                <main className="flex-1 w-full overflow-x-hidden">
                    {children}
                </main>
                <SiteFooter />
            </div>
        );
    }

    // Get current page title from pathname
    const getPageTitle = () => {
        const allItems = [...navigationItems, ...adminNavigationItems];
        const currentItem = allItems.find(item => item.href === pathname);
        return currentItem?.label || 'Dashboard';
    };

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            // Navigate to search results or filter current view
            router.push(`/dashboard/search?q=${encodeURIComponent(searchTerm)}`);
            setShowSearch(false);
            setSearchTerm('');
        }
    };

    // Handle quick action - Deposit
    const handleDeposit = () => {
        router.push('/dashboard/wallet?action=deposit');
    };

    // Handle quick action - Trade
    const handleTrade = () => {
        router.push('/dashboard/trading');
    };

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



    // Authenticated / dashboard pages use full header + sidebar shell
    return (
        <div className="flex flex-col min-h-screen bg-background w-full overflow-x-hidden">
            {/* Unified Header: marketing-style layout with dashboard color */}
            <header className="sticky top-0 z-50 w-full border-b shadow-sm" style={{ backgroundColor: '#193281' }}>
                <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-2">
                    {/* Left Section: Mobile Menu + Logo */}
                    <div className="flex items-center gap-2">
                        {user && (
                            <Button
                                variant="ghost"
                                className="px-2 text-white hover:bg-white/10 lg:hidden"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </Button>
                        )}

                        {/* Logo */}
                        <div className="cursor-pointer">
                            <Logo toDashboard={!!user} />
                        </div>
                    </div>

                    {/* Center Section: Search (for logged-in users) */}
                    {user && (
                        <div className="flex-1 max-w-md mx-4 hidden md:block">
                            {showSearch ? (
                                <form onSubmit={handleSearch} className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search transactions, users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                                        autoFocus
                                        onBlur={() => {
                                            if (!searchTerm) setShowSearch(false);
                                        }}
                                    />
                                </form>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowSearch(true)}
                                    className="text-white hover:bg-white/10 w-full justify-start"
                                >
                                    <Search className="h-4 w-4 mr-2" />
                                    <span className="text-sm">Search...</span>
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Right Section: Actions */}
                    <div className="flex items-center gap-2">
                        {!user ? (
                            // Logged-out header actions
                            <>
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
                                    Sign Up
                                </Button>
                            </>
                        ) : (
                            // Logged-in header
                            <>
                                {/* Mobile Search Icon */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden text-white hover:bg-white/10"
                                    onClick={() => setShowSearch(!showSearch)}
                                >
                                    <Search className="h-5 w-5" />
                                </Button>

                                {/* Quick Actions */}
                                <div className="hidden lg:flex gap-2">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-white/30 text-white hover:bg-white/10"
                                                    onClick={handleDeposit}
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Deposit
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Add funds to your wallet</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                                                    onClick={handleTrade}
                                                >
                                                    <ArrowUpRight className="h-4 w-4 mr-1" />
                                                    Trade
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Start trading now</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                {/* Wallet & Commission Balances */}
                                <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-md bg-white/10">
                                    {isLoading ? (
                                        <>
                                            <Skeleton className="h-4 w-20 bg-white/20" />
                                            <Skeleton className="h-4 w-20 bg-white/20" />
                                        </>
                                    ) : (
                                        <>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <div className="flex items-center text-white text-sm">
                                                            <Wallet className="h-4 w-4 mr-1" />
                                                            <span className="font-semibold">{formatCurrency(typeof walletBalance === 'string' ? parseFloat(walletBalance) : walletBalance)}</span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Wallet Balance</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <div className="h-4 w-px bg-white/30" />

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <div className="flex items-center text-sm" style={{ color: '#cb6ce6' }}>
                                                            <Share2 className="h-4 w-4 mr-1" />
                                                            <span className="font-semibold">{formatCurrency(typeof commissionBalance === 'string' ? parseFloat(commissionBalance) : commissionBalance)}</span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Commission Earnings</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </>
                                    )}
                                </div>

                                {/* Theme Toggle */}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-white hover:bg-white/10"
                                                onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
                                            >
                                                {effectiveTheme === 'dark' ? (
                                                    <Sun className="h-5 w-5" />
                                                ) : (
                                                    <Moon className="h-5 w-5" />
                                                )}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Toggle theme</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                {/* Notifications */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="relative text-white hover:bg-white/10"
                                        >
                                            <Bell className="h-5 w-5" />
                                            {unreadCount > 0 && (
                                                <Badge
                                                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500"
                                                >
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-80">
                                        <div className="flex items-center justify-between p-2 border-b">
                                            <h3 className="font-semibold">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => markAllAsRead()}
                                                    className="text-xs"
                                                >
                                                    Mark all read
                                                </Button>
                                            )}
                                        </div>
                                        <ScrollArea className="h-[300px]">
                                            {notifications.length === 0 ? (
                                                <div className="p-4 text-center text-muted-foreground">
                                                    No notifications
                                                </div>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <DropdownMenuItem
                                                        key={notification.id}
                                                        className="cursor-pointer p-3 flex-col items-start"
                                                        onClick={() => {
                                                            if (notification.id) markAsRead(notification.id);
                                                            if (notification.metadata?.link) {
                                                                router.push(notification.metadata.link);
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between w-full">
                                                            <p className="font-medium text-sm">{notification.title}</p>
                                                            {notification.priority === 'high' && (
                                                                <Badge variant="destructive" className="ml-2">!</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {notification.message}
                                                        </p>
                                                    </DropdownMenuItem>
                                                ))
                                            )}
                                        </ScrollArea>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="cursor-pointer justify-center"
                                            onClick={() => router.push('/dashboard/notifications')}
                                        >
                                            View all notifications
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

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
                                        {/* Mobile-only balance display */}
                                        <div className="md:hidden p-2 space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Wallet:</span>
                                                <span className="font-semibold">{formatCurrency(typeof walletBalance === 'string' ? parseFloat(walletBalance) : walletBalance)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Commission:</span>
                                                <span className="font-semibold" style={{ color: '#cb6ce6' }}>
                                                    {formatCurrency(typeof commissionBalance === 'string' ? parseFloat(commissionBalance) : commissionBalance)}
                                                </span>
                                            </div>
                                            <DropdownMenuSeparator />
                                        </div>
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

                {/* Mobile Search Bar (when active) */}
                {user && showSearch && (
                    <div className="md:hidden border-t border-white/10 p-2">
                        <form onSubmit={handleSearch}>
                            <Input
                                type="text"
                                placeholder="Search transactions, users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                                autoFocus
                            />
                        </form>
                    </div>
                )}

                {/* Breadcrumb / Page Title (for dashboard pages) */}
                {user && pathname.startsWith('/dashboard') && (
                    <div className="border-t border-white/10 px-4 sm:px-6 lg:px-8 py-2">
                        <div className="max-w-7xl mx-auto flex items-center text-sm text-white/80">
                            <HomeIcon className="h-4 w-4 mr-1" />
                            <ChevronRight className="h-4 w-4 mx-1" />
                            <span className="font-medium text-white">{getPageTitle()}</span>
                        </div>
                    </div>
                )}
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
                    className="flex-1 p-4 min-w-0 overflow-x-hidden flex flex-col"
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
