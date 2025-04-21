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
} from "@/components/ui/dropdown-menu"
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
    Bell,
    Settings,
    LogOut,
    TrendingUp,
    AlertCircle,
    Users,
    BadgeCheck,
    BadgeAlert,
    PiggyBank,
    HandCoins,
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

interface HeaderProps {
    walletBalance: number;
    commissionBalance: number;
    searchTerm: string;
    handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
    searchResults: any[];
    kycStatus: 'pending' | 'verified' | 'unverified';
    membershipTier: string;
}

const Header: React.FC<HeaderProps & { onMobileMenuClick: () => void; isSidebarCollapsed: boolean }> = ({ 
    walletBalance, 
    commissionBalance, 
    searchTerm, 
    handleSearch, 
    searchResults,
    kycStatus,
    membershipTier,
    onMobileMenuClick,
    isSidebarCollapsed
}) => {
    const { user, signOutUser } = useAuth();
    const router = useRouter();
    const tier = getMembershipTier(membershipTier);

    const KycStatusBadge = () => {
        switch (kycStatus) {
            case 'verified':
                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Badge variant="success" className="ml-2">
                                    <BadgeCheck className="w-4 h-4 mr-1" />
                                    Verified
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Your KYC verification is complete</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            case 'pending':
                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Badge
                                    className="ml-2"
                                    style={{ backgroundColor: '#5e17eb', color: 'white' }}
                                >
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    Pending
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>KYC verification in progress</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            default:
                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Badge variant="destructive" className="ml-2">
                                    <BadgeAlert className="w-4 h-4 mr-1" />
                                    Unverified
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Please complete KYC verification</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
        }
    };

    return (
        <header className="bg-primary text-primary-foreground py-3 px-4 flex items-center justify-between shadow-md relative">
            <div className="flex items-center">
                {/* Hamburger for mobile */}
                <button
                    className="mr-2 sm:hidden flex items-center justify-center p-2 rounded hover:bg-primary/80 focus:outline-none"
                    aria-label="Open sidebar menu"
                    onClick={onMobileMenuClick}
                >
                    <Menu className="w-6 h-6" />
                </button>
                {/* Logo: show in header if sidebar is collapsed (desktop) or always on mobile */}
                <span className={cn(
                    "mr-2 cursor-pointer logo-animated",
                    "block sm:hidden", // always show on mobile
                    isSidebarCollapsed ? "hidden sm:block" : "hidden" // show on desktop only if collapsed
                )}>
                    <Image
                        src="/assets/coinbox-ai.svg"
                        alt="App Logo"
                        width={40}
                        height={40}
                        className="logo-animated"
                        onClick={() => router.push('/')}
                    />
                </span>
                <div className="w-40 sm:w-64 ml-2 sm:ml-4 relative">
                    <Input
                        type="search"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full"
                    />
                    {searchTerm && searchResults.length > 0 && (
                        <Card className="absolute z-20 w-full mt-1 left-0">
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
                    <Badge className={cn("px-2 py-1", tier.color)}>
                        {tier.displayName}
                    </Badge>
                    <KycStatusBadge />
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">
                                <Wallet className="w-4 h-4 mr-2" />
                                {formatCurrency(walletBalance)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                            <DropdownMenuItem>
                                <Coins className="w-4 h-4 mr-2" />
                                Commission: {formatCurrency(commissionBalance)}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/dashboard/wallet')}>
                                <PiggyBank className="w-4 h-4 mr-2" />
                                Buy Coins
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/dashboard/wallet/history')}>
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Transaction History
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ) : (
                <div className="space-x-4">
                    <Button
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
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
        </header>
    );
};

// Sidebar overlay for mobile
const SidebarOverlay: React.FC<{ show: boolean; onClose: () => void }> = ({ show, onClose }) => (
    <div
        className={cn(
            "fixed inset-0 bg-black bg-opacity-40 z-[99] transition-opacity duration-200",
            show ? "block" : "hidden"
        )}
        aria-hidden={!show}
        onClick={onClose}
    />
);

interface SidebarProps {
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps & { mobileOpen: boolean; onMobileClose: () => void }> = ({
    isCollapsed,
    toggleCollapse,
    mobileOpen,
    onMobileClose
}) => {
    const router = useRouter();
    const { user } = useAuth();

    // Define navigation items for logged-in and logged-out users
    const loggedOutItems = [
        { icon: HomeIcon, label: 'Home', path: '/' },
        { icon: UserIcon, label: 'About Us', path: '/about' },
        { icon: HelpCircle, label: 'Contact Us', path: '/contact' },
    ];
    const loggedInItems = [
        { icon: HomeIcon, label: 'Dashboard', path: '/dashboard' },
        { icon: Coins, label: 'Trading', path: '/dashboard/trading' },
        { icon: PiggyBank, label: 'Investments', path: '/dashboard/investments' },
        { icon: HandCoins, label: 'Loans', path: '/dashboard/loans' },
        { icon: Share2, label: 'Referrals', path: '/dashboard/referral' },
        { icon: Wallet, label: 'Wallet', path: '/dashboard/wallet' },
        { icon: Users, label: 'Community', path: '/dashboard/community' },
        { icon: Shield, label: 'Security', path: '/dashboard/security' },
        { icon: HelpCircle, label: 'Support', path: '/dashboard/support' },
    ];

    // Determine which items to show
    const navigationItems = user ? loggedInItems : loggedOutItems;

    // Get current path for active link styling
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

    return (
        <>
            {/* Desktop sidebar */}
            <aside
                className={cn(
                    "bg-secondary text-secondary-foreground flex flex-col transition-width duration-300 shadow-md h-full z-30",
                    isCollapsed ? 'w-16' : 'w-64',
                    "hidden sm:flex"
                )}
            >
                <div className="flex items-center justify-between p-4">
                    {/* Logo: show only if sidebar is expanded */}
                    {!isCollapsed && (
                        <Image
                            src="/assets/coinbox-ai.svg"
                            alt="Sidebar Logo"
                            width={40}
                            height={40}
                            className="cursor-pointer logo-animated"
                            onClick={() => router.push('/')}
                        />
                    )}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleCollapse}
                                    className="hover:bg-[#5e17eb]"
                                >
                                    <Menu className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Toggle Sidebar
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="p-4">
                    <Input type="text" placeholder="Search..." className="bg-secondary-foreground/10 border-none text-secondary-foreground" />
                </div>
                <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                        {navigationItems.map((item) => {
                            const isActive = currentPath === item.path || (currentPath.startsWith(item.path) && item.path !== '/');
                            return (
                                <li key={item.path}>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className={cn(
                                                        "w-full justify-start transition-colors",
                                                        isCollapsed ? "px-2" : "px-4",
                                                        isActive
                                                            ? "bg-[#193281] text-white"
                                                            : "hover:bg-white hover:text-[#5e17eb] text-secondary-foreground"
                                                    )}
                                                    style={isActive ? { pointerEvents: 'none' } : {}}
                                                    onClick={() => router.push(item.path)}
                                                >
                                                    <item.icon className={cn(
                                                        "h-4 w-4",
                                                        isCollapsed ? "mr-0" : "mr-2"
                                                    )} />
                                                    {!isCollapsed && <span>{item.label}</span>}
                                                </Button>
                                            </TooltipTrigger>
                                            {isCollapsed && (
                                                <TooltipContent side="right">
                                                    {item.label}
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>
            {/* Mobile sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 h-full bg-secondary text-secondary-foreground flex flex-col shadow-lg z-[100] transition-transform duration-300 sm:hidden",
                    mobileOpen ? "translate-x-0" : "-translate-x-full",
                    "w-64"
                )}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between p-4">
                    {/* Always show logo in mobile sidebar */}
                    <Image
                        src="/assets/coinbox-ai.svg"
                        alt="Sidebar Logo"
                        width={40}
                        height={40}
                        className="cursor-pointer logo-animated"
                        onClick={() => router.push('/')}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMobileClose}
                        aria-label="Close sidebar"
                        className="hover:bg-[#5e17eb]"
                    >
                        <Menu className="h-4 w-4" />
                    </Button>
                </div>
                <div className="p-4">
                    <Input type="text" placeholder="Search..." className="bg-secondary-foreground/10 border-none text-secondary-foreground" />
                </div>
                <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                        {navigationItems.map((item) => {
                            const isActive = currentPath === item.path || (currentPath.startsWith(item.path) && item.path !== '/');
                            return (
                                <li key={item.path}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start transition-colors",
                                            isActive
                                                ? "bg-[#193281] text-white"
                                                : "hover:bg-white hover:text-[#5e17eb] text-secondary-foreground"
                                        )}
                                        style={isActive ? { pointerEvents: 'none' } : {}}
                                        onClick={() => {
                                            router.push(item.path);
                                            onMobileClose();
                                        }}
                                    >
                                        <item.icon className="h-4 w-4 mr-2" />
                                        <span>{item.label}</span>
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>
        </>
    );
};

interface HeaderSidebarLayoutProps {
    children: React.ReactNode;
}

const HeaderSidebarLayout: React.FC<HeaderSidebarLayoutProps> = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const { user } = useAuth();
    const router = useRouter();
    const [walletBalance, setWalletBalance] = useState(0);
    const [commissionBalance, setCommissionBalance] = useState(0);
    const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | 'unverified'>('unverified');
    const [membershipTier, setMembershipTier] = useState('BASIC');

    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    useEffect(() => {
        setWalletBalance(1800);
        setCommissionBalance(500);
    }, []);

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        const mockResults = [
            { id: 1, title: "Trading Guide", link: "/trading/guide" },
            { id: 2, title: "Wallet FAQs", link: "/wallet/faq" },
            { id: 3, title: "Referral Program Details", link: "/referral/details" },
        ];

        const filteredResults = mockResults.filter(result =>
            result.title.toLowerCase().includes(event.target.value.toLowerCase())
        );

        setSearchResults(filteredResults);
    };

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (mobileSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, [mobileSidebarOpen]);

    return (
        <div className="flex h-screen">
            {/* Sidebar for desktop and mobile */}
            <Sidebar
                isCollapsed={isCollapsed}
                toggleCollapse={toggleCollapse}
                mobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
            />
            {/* Overlay for mobile sidebar */}
            <SidebarOverlay show={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
            <div className="flex-1 flex flex-col">
                <Header 
                    walletBalance={walletBalance} 
                    commissionBalance={commissionBalance} 
                    searchTerm={searchTerm} 
                    handleSearch={handleSearch} 
                    searchResults={searchResults}
                    kycStatus={kycStatus}
                    membershipTier={membershipTier}
                    onMobileMenuClick={() => setMobileSidebarOpen(true)}
                    isSidebarCollapsed={isCollapsed}
                />
                <main className="flex-1 p-2 sm:p-4 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default HeaderSidebarLayout;
