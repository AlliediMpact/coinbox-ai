'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  SearchIcon, 
  Calendar, 
  Download, 
  FileText, 
  Filter,
  SortDesc
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

interface CommissionHistoryProps {
  commissions: any[];
}

export function CommissionHistory({ commissions }: CommissionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  if (!commissions || commissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
          <CardDescription>No commission records found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-sm text-muted-foreground">
            Your commission history will appear here once you start earning from referrals
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Filter commissions based on search query and status
  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = 
      commission.referredUserId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commission.amount?.toString().includes(searchQuery) ||
      commission.status?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Sort commissions by date
  const sortedCommissions = [...filteredCommissions].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt?.toDate?.() || a.createdAt);
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt?.toDate?.() || b.createdAt);
    
    return sortDirection === 'asc' 
      ? dateA.getTime() - dateB.getTime() 
      : dateB.getTime() - dateA.getTime();
  });
  
  // Format date
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date?.toDate?.() || date);
    return dateObj.toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-500">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/10 text-blue-500">Processing</Badge>;
      case 'declined':
        return <Badge className="bg-red-500/10 text-red-500">Declined</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };
  
  // View commission details
  const viewCommissionDetails = (commission: any) => {
    setSelectedCommission(commission);
    setShowDetails(true);
  };
  
  // Group commissions by month for the summary view
  const getCommissionsByMonth = () => {
    const monthlyCommissions: Record<string, { totalAmount: number, count: number }> = {};
    
    commissions.forEach(commission => {
      const date = commission.createdAt instanceof Date 
        ? commission.createdAt 
        : new Date(commission.createdAt?.toDate?.() || commission.createdAt);
      
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const displayDate = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!monthlyCommissions[monthYear]) {
        monthlyCommissions[monthYear] = { 
          totalAmount: 0, 
          count: 0,
          displayDate 
        };
      }
      
      monthlyCommissions[monthYear].totalAmount += commission.amount || 0;
      monthlyCommissions[monthYear].count += 1;
    });
    
    return Object.entries(monthlyCommissions)
      .map(([key, value]) => ({ 
        monthYear: key, 
        ...value 
      }))
      .sort((a, b) => {
        const [yearA, monthA] = a.monthYear.split('-').map(Number);
        const [yearB, monthB] = b.monthYear.split('-').map(Number);
        
        if (yearA === yearB) {
          return monthB - monthA;
        }
        return yearB - yearA;
      });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
          <CardDescription>View and manage your commission records</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="list">Detailed List</TabsTrigger>
                <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-1 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSortDirection(
                  sortDirection === 'asc' ? 'desc' : 'asc'
                )}>
                  <SortDesc className="mr-1 h-4 w-4" />
                  {sortDirection === 'asc' ? 'Oldest First' : 'Newest First'}
                </Button>
              </div>
            </div>
          
            <TabsContent value="list">
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-full max-w-sm">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search commission records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-1 h-4 w-4" />
                      {statusFilter === 'all' ? 'All Status' : `Status: ${statusFilter}`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                      All Status
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                      Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('paid')}>
                      Paid
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('processing')}>
                      Processing
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Referral ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCommissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(commission.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {commission.referredUserId?.substring(0, 8) || 'N/A'}...
                        </TableCell>
                        <TableCell className="font-semibold">
                          R{commission.amount?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(commission.status)}
                        </TableCell>
                        <TableCell>
                          {commission.paymentDate ? formatDate(commission.paymentDate) : 'Pending'}
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
                              <DropdownMenuItem onClick={() => viewCommissionDetails(commission)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Download Receipt
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {filteredCommissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No commission records match your criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="summary">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Commissions Count</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCommissionsByMonth().map((monthly) => (
                      <TableRow key={monthly.monthYear}>
                        <TableCell className="font-medium">
                          {monthly.displayDate}
                        </TableCell>
                        <TableCell>
                          {monthly.count} commission{monthly.count !== 1 ? 's' : ''}
                        </TableCell>
                        <TableCell className="font-semibold">
                          R{monthly.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <FileText className="mr-1 h-4 w-4" />
                            Monthly Report
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Commission Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commission Details</DialogTitle>
            <DialogDescription>
              Detailed information about this commission
            </DialogDescription>
          </DialogHeader>
          
          {selectedCommission && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Commission ID</h4>
                  <p className="text-sm">{selectedCommission.id}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <div className="mt-1">{getStatusBadge(selectedCommission.status)}</div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Created Date</h4>
                  <p className="text-sm">{formatDate(selectedCommission.createdAt)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Payment Date</h4>
                  <p className="text-sm">
                    {selectedCommission.paymentDate ? formatDate(selectedCommission.paymentDate) : 'Pending'}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Commission Amount</h4>
                  <p className="text-sm font-semibold">R{selectedCommission.amount?.toFixed(2) || '0.00'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Referral Tier</h4>
                  <p className="text-sm capitalize">{selectedCommission.membershipTier || 'Basic'}</p>
                </div>
                
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Referred User ID</h4>
                  <p className="text-sm break-all">{selectedCommission.referredUserId}</p>
                </div>
                
                {selectedCommission.notes && (
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                    <p className="text-sm">{selectedCommission.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button variant="outline" size="sm" className="mr-2">
                  <Download className="mr-1 h-4 w-4" />
                  Download Receipt
                </Button>
                <Button variant="default" size="sm" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
