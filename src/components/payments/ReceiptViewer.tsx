import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { receiptService } from '@/lib/receipt-service';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Share2, Printer, ArrowLeft } from "lucide-react";
import { formatCurrency } from '@/lib/utils';

interface ReceiptViewerProps {
  receiptId: string;
  onBack?: () => void;
}

export default function ReceiptViewer({ receiptId, onBack }: ReceiptViewerProps) {
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const receiptData = await receiptService.getReceipt(receiptId);
        setReceipt(receiptData);
      } catch (error) {
        console.error("Error fetching receipt:", error);
        toast({
          title: "Error",
          description: "Failed to load receipt details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (receiptId) {
      fetchReceipt();
    }
  }, [receiptId, toast]);

  const handleDownloadPDF = () => {
    if (receipt?.pdfUrl) {
      window.open(receipt.pdfUrl, '_blank');
    } else {
      toast({
        title: "PDF Not Available",
        description: "The PDF version of this receipt is not available",
        variant: "destructive"
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt for payment ${receipt.paymentId}`,
          text: `Receipt for R${receipt.amount} payment on CoinBox`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Receipt link copied to clipboard",
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return "bg-green-500 hover:bg-green-600";
      case 'pending':
        return "bg-yellow-500 hover:bg-yellow-600";
      case 'failed':
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-3xl mx-auto print:shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-24" />
          </CardTitle>
          <CardDescription><Skeleton className="h-4 w-full" /></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/4" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/4" />
          </div>
          <div className="border-t pt-4">
            <Skeleton className="h-6 w-full" />
            <div className="mt-2">
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </CardFooter>
      </Card>
    );
  }

  if (!receipt) {
    return (
      <Card className="w-full max-w-3xl mx-auto print:shadow-none">
        <CardHeader>
          <CardTitle>Receipt Not Found</CardTitle>
          <CardDescription>The requested receipt could not be found or has been deleted.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const formattedDate = new Date(receipt.date).toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const formattedTime = new Date(receipt.date).toLocaleTimeString('en-ZA');

  return (
    <Card className="w-full max-w-3xl mx-auto print:shadow-none">
      <CardHeader className="print:border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="mr-2 h-6 w-6 text-primary" />
            Payment Receipt
          </div>
          <Badge className={`${getStatusBadgeColor(receipt.status)} text-white`}>
            {receipt.status.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>Receipt #{receipt.id.slice(0, 8)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Receipt Header Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
            <p className="text-sm">{formattedDate} at {formattedTime}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Transaction ID</h3>
            <p className="text-sm font-mono">{receipt.paymentId}</p>
          </div>
        </div>

        {/* Amount */}
        <div className="bg-muted/50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Total Amount</h3>
            <p className="text-xl font-bold">{formatCurrency(receipt.amount, receipt.currency)}</p>
          </div>
        </div>

        {/* Items */}
        {receipt.items && receipt.items.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Details</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {receipt.items.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{item.description}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{item.quantity}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{formatCurrency(item.unitPrice, receipt.currency)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{formatCurrency(item.totalPrice, receipt.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="border-t pt-4 text-sm text-muted-foreground">
          <p className="mb-1">This receipt was automatically generated by CoinBox Connect.</p>
          <p>For any questions regarding this payment, please contact support@coinboxconnect.com.</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between print:hidden">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrint} title="Print Receipt">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare} title="Share Receipt">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button onClick={handleDownloadPDF} disabled={!receipt.pdfUrl}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
