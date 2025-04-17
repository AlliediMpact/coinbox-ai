'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    Cog,
    LogOut,
    PackagePlus,
    CreditCard,
    Settings,
    TrendingUp,
    AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from '@/components/AuthProvider';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface HeaderProps {
    walletBalance: number;
    commissionBalance: number;
    searchTerm: string;
    handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
    searchResults: any[];
}

const Header: React.FC<HeaderProps> = ({ walletBalance, commissionBalance, searchTerm, handleSearch, searchResults }) => {
    const { user, signOutUser } = useAuth();
    const router = useRouter();

    return (
        <header className="bg-primary text-primary-foreground py-3 px-4 flex items-center justify-between shadow-md">
            <div className="flex items-center">
                <Image
                    src="/assets/CoinBoxLogo01.png"
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
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">
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
                            <Button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">
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

    return (
        <aside className={cn(
            "bg-secondary text-secondary-foreground w-64 flex flex-col transition-width duration-300",
            isCollapsed ? 'w-16' : 'w-64',
            "shadow-md"
        )}>
            <div className="flex items-center justify-between p-4">
                <Image
                    src="/assets/CoinBoxLogo02.png"
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
                    <li>
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" className="justify-start" onClick={() => router.push('/') }>
                                        <HomeIcon className="mr-2 h-4 w-4" />
                                        <span>Home</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Home
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </li>
                    <li>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" className="justify-start" onClick={() => router.push('/about')}>
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        <span>About Us</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  About Us
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </li>
                    <li>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" className="justify-start" onClick={() => router.push('/contact')}>
                                        <HelpCircle className="mr-2 h-4 w-4" />
                                        <span>Contact Us</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Contact Us
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </li>
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
    const { user, signOutUser } = useAuth();
    const router = useRouter();
    const [walletBalance, setWalletBalance] = useState(0);
    const [commissionBalance, setCommissionBalance] = useState(0);

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
                <Header walletBalance={walletBalance} commissionBalance={commissionBalance} searchTerm={searchTerm} handleSearch={handleSearch} searchResults={searchResults} />
                <main className="flex-1 p-4">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default HeaderSidebarLayout;
