import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { receiptService } from '@/lib/receipt-service';
import { useToast } from '@/hooks/use-toast';
import ReceiptViewer from './ReceiptViewer';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Search, SlidersHorizontal, Calendar, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from '@/lib/utils';

export default function ReceiptManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    const fetchReceipts = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userReceipts = await receiptService.listUserReceipts(user.uid);
        setReceipts(userReceipts);
        setFilteredReceipts(userReceipts);
      } catch (error) {
        console.error("Error fetching receipts:", error);
        toast({
          title: "Error",
          description: "Failed to load receipts",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [user, toast]);

  // Filter receipts based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredReceipts(receipts);
    } else {
      const filtered = receipts.filter(receipt => 
        receipt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReceipts(filtered);
    }
  }, [searchTerm, receipts]);

  const handleViewReceipt = (receiptId: string) => {
    setSelectedReceipt(receiptId);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setSelectedReceipt(null);
    setViewerOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return "bg-green-500 hover:bg-green-600 text-white";
      case 'pending':
        return "bg-yellow-500 hover:bg-yellow-600 text-white";
      case 'failed':
        return "bg-red-500 hover:bg-red-600 text-white";
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white";
    }
  };

  const renderSkeletonRows = () => {
    return Array(5).fill(0).map((_, index) => (
      <tr key={index} className="border-b">
        <td className="p-3"><Skeleton className="h-5 w-24" /></td>
        <td className="p-3"><Skeleton className="h-5 w-32" /></td>
        <td className="p-3"><Skeleton className="h-5 w-20" /></td>
        <td className="p-3"><Skeleton className="h-5 w-16" /></td>
        <td className="p-3"><Skeleton className="h-5 w-24" /></td>
        <td className="p-3"><Skeleton className="h-8 w-20" /></td>
      </tr>
    ));
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="mr-2 h-5 w-5" /> 
              Payment Receipts
            </div>
            <Button variant="outline" size="sm" className="hidden md:flex">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </CardTitle>
          <CardDescription>
            View and download your payment receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by receipt ID or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" className="md:w-auto">
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button variant="outline" className="md:w-auto">
              <Calendar className="mr-2 h-4 w-4" /> Date Range
            </Button>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>

            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                      <th className="p-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      renderSkeletonRows()
                    ) : filteredReceipts.length > 0 ? (
                      filteredReceipts.map((receipt) => (
                        <tr key={receipt.id} className="hover:bg-muted/50">
                          <td className="p-3 text-sm font-mono">
                            {receipt.id.slice(0, 8)}...
                          </td>
                          <td className="p-3 text-sm">
                            {formatDate(receipt.date)}
                          </td>
                          <td className="p-3 text-sm">
                            {formatCurrency(receipt.amount, receipt.currency)}
                          </td>
                          <td className="p-3">
                            <Badge className={getStatusColor(receipt.status)}>
                              {receipt.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm max-w-[200px] truncate">
                            {receipt.description}
                          </td>
                          <td className="p-3 text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewReceipt(receipt.id)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          {searchTerm ? 
                            "No receipts match your search criteria" : 
                            "No receipts found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Receipt Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <ReceiptViewer 
              receiptId={selectedReceipt} 
              onBack={handleCloseViewer} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
