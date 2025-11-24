'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, SearchIcon, SortAsc, SortDesc } from "lucide-react";

interface ReferralListProps {
  referrals: any[];
  membership: any;
}

export function ReferralList({ referrals, membership }: ReferralListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('joinDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  if (!referrals || referrals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
          <CardDescription>You haven&apos;t referred anyone yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-sm text-muted-foreground">
            Share your referral code to start earning commissions from your network
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Get commission rate based on membership tier
  const getCommissionRate = (referredUserTier: string) => {
    const currentTier = membership?.currentTier || 'basic';
    
    // Commission rates based on referrer and referee tiers
    const commissionRates: Record<string, Record<string, number>> = {
      'basic': { 'basic': 3, 'ambassador': 3.5, 'vip': 4, 'business': 4.5 },
      'ambassador': { 'basic': 3.5, 'ambassador': 4, 'vip': 4.5, 'business': 5 },
      'vip': { 'basic': 4, 'ambassador': 4.5, 'vip': 5, 'business': 5.5 },
      'business': { 'basic': 4.5, 'ambassador': 5, 'vip': 5.5, 'business': 6 }
    };
    
    return commissionRates[currentTier]?.[referredUserTier] || 3;
  };
  
  // Filter referrals based on search query
  const filteredReferrals = referrals.filter(referral => 
    referral.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    referral.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    referral.tier?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort referrals
  const sortedReferrals = [...filteredReferrals].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortField === 'joinDate' || sortField === 'lastActive') {
      const dateA = aValue instanceof Date ? aValue : new Date(aValue);
      const dateB = bValue instanceof Date ? bValue : new Date(bValue);
      return sortDirection === 'asc' 
        ? dateA.getTime() - dateB.getTime() 
        : dateB.getTime() - dateA.getTime();
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const strA = String(aValue || '').toLowerCase();
    const strB = String(bValue || '').toLowerCase();
    return sortDirection === 'asc' 
      ? strA.localeCompare(strB) 
      : strB.localeCompare(strA);
  });
  
  // Toggle sort direction and field
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Helper to get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-500/10 text-green-500';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500';
      case 'inactive': return 'bg-gray-500/10 text-gray-500';
      default: return 'bg-blue-500/10 text-blue-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Referrals</CardTitle>
        <CardDescription>Manage and track your referral network</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search referrals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Button variant="outline" size="sm" onClick={() => handleSort('joinDate')}>
            {sortDirection === 'asc' ? <SortAsc className="mr-1 h-4 w-4" /> : <SortDesc className="mr-1 h-4 w-4" />}
            Sort
          </Button>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead onClick={() => handleSort('tier')} className="cursor-pointer">
                  Tier {sortField === 'tier' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead onClick={() => handleSort('joinDate')} className="cursor-pointer">
                  Joined {sortField === 'joinDate' && (sortDirection === 'asc' ? '↑' : &apos;↓&apos;)}
                </TableHead>
                <TableHead onClick={() => handleSort('commissionsEarned')} className="cursor-pointer text-right">
                  Commission {sortField === 'commissionsEarned' && (sortDirection === 'asc' ? '↑' : &apos;↓&apos;)}
                </TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReferrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={referral.photoURL} alt={referral.displayName} />
                        <AvatarFallback>{getInitials(referral.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{referral.displayName || 'User&apos;}</span>
                        <span className="text-xs text-muted-foreground">{referral.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {referral.tier || &apos;Basic&apos;}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(referral.joinDate?.toDate?.() || referral.joinDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {referral.commissionsEarned 
                      ? `R${referral.commissionsEarned.toFixed(2)}` 
                      : `${getCommissionRate(referral.tier || &apos;basic&apos;)}%`
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={getStatusColor(referral.status)}>
                      {referral.status || &apos;Active&apos;}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>View Commission History</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredReferrals.length === 0 && searchQuery && (
          <p className="text-center py-4 text-sm text-muted-foreground">
            No referrals match your search criteria
          </p>
        )}
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Showing {filteredReferrals.length} of {referrals.length} referrals
        </div>
      </CardContent>
    </Card>
  );
}
