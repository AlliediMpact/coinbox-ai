'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { enhancedPaystackService } from '@/lib/paystack-service-enhanced';
import { membershipService } from '@/lib/membership-service';
import { receiptService } from '@/lib/receipt-service';
import { MembershipTier, MEMBERSHIP_TIERS } from '@/lib/membership-tiers';
import { 
  CreditCard, 
  Receipt, 
  History, 
  DollarSign,
  Calendar,
  Download,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface PaymentHistory {
  id: string;
  reference: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  type: 'membership' | 'transaction';
  description: string;
  createdAt: Date;
  receiptUrl?: string;
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [membership, setMembership] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  const loadPaymentData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load user membership
      const userMembership = await membershipService.getUserMembership(user!.uid);
      setMembership(userMembership);

      // Load payment history
      const history = await enhancedPaystackService.getPaymentHistory(user!.uid);
      setPaymentHistory(history);
    } catch (error) {
      console.error("Failed to load payment data:", error);
      toast({
        title: "Error",
        description: "Could not load payment data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadPaymentData();
    }
  }, [user, loadPaymentData]);

  const handleMembershipUpgrade = async (targetTier: MembershipTier) => {
    try {
      setProcessingPayment(targetTier);
      
      const { authorizationUrl } = await enhancedPaystackService.initializeMembershipPayment(
        user!.uid,
        user!.email!,
        targetTier,
        `${window.location.origin}/dashboard/payments?upgrade=success`
      );

      // Redirect to Paystack payment page
      window.location.href = authorizationUrl;
    } catch (error) {
      console.error('Failed to initialize payment:', error);
      setProcessingPayment(null);
    }
  };

  const downloadReceipt = async (receiptUrl: string, reference: string) => {
    try {
      const response = await fetch(receiptUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `receipt-${reference}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download receipt:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      failed: 'destructive',
      pending: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="payments-page max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments & Billing</h1>
        <p className="text-gray-600">Manage your membership, view payment history, and download receipts</p>
      </div>

      {/* Current Membership Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Membership
          </CardTitle>
          <CardDescription>
            Your active membership tier and benefits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membership ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-blue-600">{membership.currentTier}</h3>
                <p className="text-sm text-gray-600">
                  Security Deposit: {formatCurrency(MEMBERSHIP_TIERS[membership.currentTier].securityFee)}
                </p>
                <p className="text-sm text-gray-600">
                  Commission Rate: {MEMBERSHIP_TIERS[membership.currentTier].commission}%
                </p>
              </div>
              <Badge variant="default" className="text-sm">
                Active
              </Badge>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No active membership</p>
              <Button onClick={() => handleMembershipUpgrade('Basic')}>
                Get Started
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="history" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="upgrade">Upgrade Membership</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>
                View all your payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No payment history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(payment.status)}
                          <div>
                            <p className="font-medium">{payment.description}</p>
                            <p className="text-sm text-gray-600">
                              Ref: {payment.reference}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(payment.amount)}</p>
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600">
                          {payment.createdAt.toLocaleDateString()}
                        </p>
                        {payment.receiptUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadReceipt(payment.receiptUrl!, payment.reference)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upgrade" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(MEMBERSHIP_TIERS).map(([tier, details]) => (
              <Card key={tier} className={`relative ${membership?.currentTier === tier ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-lg">{tier}</CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold">{formatCurrency(details.securityFee)}</span>
                    <span className="text-sm text-gray-600"> security deposit</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <p>Loan Limit: {formatCurrency(details.loanLimit)}</p>
                    <p>Investment Limit: {formatCurrency(details.investmentLimit)}</p>
                    <p>Commission: {details.commission}%</p>
                    <p>Admin Fee: {formatCurrency(details.adminFee)}</p>
                  </div>
                  
                  {membership?.currentTier === tier ? (
                    <Badge className="w-full justify-center">Current Plan</Badge>
                  ) : (
                    <Button 
                      className="w-full"
                      disabled={processingPayment === tier}
                      onClick={() => handleMembershipUpgrade(tier)}
                    >
                      {processingPayment === tier ? 'Processing...' : `Upgrade to ${tier}`}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Download Receipts
              </CardTitle>
              <CardDescription>
                Access and download your payment receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentHistory.filter(p => p.receiptUrl).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No receipts available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory
                    .filter(payment => payment.receiptUrl)
                    .map((payment) => (
                      <div key={payment.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{payment.description}</p>
                            <p className="text-sm text-gray-600">
                              {payment.createdAt.toLocaleDateString()} • {formatCurrency(payment.amount)}
                            </p>
                          </div>
                          <Button 
                            variant="outline"
                            onClick={() => downloadReceipt(payment.receiptUrl!, payment.reference)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </ProtectedRoute>
  );
}
