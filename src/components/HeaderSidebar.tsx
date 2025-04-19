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

const Header: React.FC<HeaderProps> = ({ 
    walletBalance, 
    commissionBalance, 
    searchTerm, 
    handleSearch, 
    searchResults,
    kycStatus,
    membershipTier
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
                                <Badge variant="warning" className="ml-2">
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
        <header className="bg-primary text-primary-foreground py-3 px-4 flex items-center justify-between shadow-md">
            <div className="flex items-center">
                <Image
                    src="/assets/coinbox-ai.svg"
                    alt="App Logo"
                    width={50}
                    height={50}
                    className="mr-2 cursor-pointer"
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

interface SidebarProps {
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleCollapse }) => {
    const router = useRouter();

    const navigationItems = [
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

    return (
        <aside className={cn(
            "bg-secondary text-secondary-foreground flex flex-col transition-width duration-300",
            isCollapsed ? 'w-16' : 'w-64',
            "shadow-md"
        )}>
            <div className="flex items-center justify-between p-4">
                <Image
                    src="/assets/coinbox-ai.svg"
                    alt="Sidebar Logo"
                    width={40}
                    height={40}
                    className="cursor-pointer"
                    onClick={() => router.push('/')}
                    style={{ display: isCollapsed ? 'none' : 'block' }}
                />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={toggleCollapse}>
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
                    {navigationItems.map((item) => (
                        <li key={item.path}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start",
                                                isCollapsed ? "px-2" : "px-4"
                                            )}
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
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

interface HeaderSidebarLayoutProps {
    children: React.ReactNode;
}

const HeaderSidebarLayout: React.FC<HeaderSidebarLayoutProps> = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
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

    return (
        <div className="flex h-screen">
            <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
            <div className="flex-1 flex flex-col">
                <Header 
                    walletBalance={walletBalance} 
                    commissionBalance={commissionBalance} 
                    searchTerm={searchTerm} 
                    handleSearch={handleSearch} 
                    searchResults={searchResults}
                    kycStatus={kycStatus}
                    membershipTier={membershipTier}
                />
                <main className="flex-1 p-4 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default HeaderSidebarLayout;
