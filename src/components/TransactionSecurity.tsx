'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { transactionMonitoringAPI } from "@/lib/transaction-monitoring-api";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle, AlertTriangle, CheckCircle, ExternalLink, RefreshCw, ShieldAlert } from "lucide-react";
import { TransactionAlert } from "@/lib/transaction-monitoring-service";
import { formatDistance } from "date-fns";
import PageLoading from "@/components/PageLoading";

export default function TransactionSecurity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tradingStatus, setTradingStatus] = useState<{
    status: 'normal' | 'restricted';
    alerts: number;
    criticalAlerts: number;
    isFlagged: boolean;
    reason: string | null;
  } | null>(null);
  const [userAlerts, setUserAlerts] = useState<TransactionAlert[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [alertDetailsOpen, setAlertDetailsOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<TransactionAlert | null>(null);

  // Load user trading status on component mount
  useEffect(() => {
    if (!user) return;
    
    loadUserData();
  }, [user]);

  // Function to load user security data
  const loadUserData = async () => {
    setLoading(true);
    try {
      // Check trading status
      const status = await transactionMonitoringAPI.checkUserTradingStatus(user.uid);
      setTradingStatus(status);
      
      // Get user alerts
      const alerts = await transactionMonitoringAPI.getUserAlerts(user.uid);
      setUserAlerts(alerts);
    } catch (error) {
      console.error("Error loading security data:", error);
      toast({
        title: "Error",
        description: "Failed to load security information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
    
    toast({
      title: "Refreshed",
      description: "Security information has been updated",
    });
  };

  // Function to show alert details
  const handleViewAlert = (alert: TransactionAlert) => {
    setSelectedAlert(alert);
    setAlertDetailsOpen(true);
  };

  // Format date for display
  const formatDate = (date: Date | any) => {
    if (!date) return 'N/A';
    try {
      const dateObj = new Date(date instanceof Date ? date : date.toDate());
      return formatDistance(dateObj, new Date(), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return <PageLoading message="Loading security information..." />;
  }

  return (
    <div className="transaction-security">
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <ShieldAlert className="h-5 w-5 mr-2" />
                Transaction Security Status
              </CardTitle>
              <CardDescription>
                Monitor your account security and transaction compliance
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6 p-4 rounded-lg border">
            <div className="flex items-center">
              {tradingStatus?.status === 'normal' ? (
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-amber-500 mr-3" />
              )}
              <div>
                <h3 className="font-semibold">
                  Trading Status: 
                  <span className={
                    tradingStatus?.status === 'normal' 
                      ? 'text-green-600 ml-2'
                      : 'text-amber-600 ml-2'
                  }>
                    {tradingStatus?.status === 'normal' ? 'Normal' : 'Restricted'}
                  </span>
                </h3>
                <p className="text-sm text-gray-500">
                  {tradingStatus?.status === 'normal'
                    ? 'Your account has normal trading privileges'
                    : `Restricted: ${tradingStatus?.reason || 'Security review in progress'}`
                  }
                </p>
              </div>
            </div>

            <Badge className={
              tradingStatus?.status === 'normal'
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }>
              {tradingStatus?.alerts} Alert{tradingStatus?.alerts !== 1 ? 's' : ''}
            </Badge>
          </div>

          {tradingStatus?.status === 'restricted' && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Trading Restrictions in Place</AlertTitle>
              <AlertDescription>
                Your account currently has trading restrictions due to suspicious activity. 
                Please contact support for assistance.
              </AlertDescription>
            </Alert>
          )}

          <h3 className="font-semibold mb-3">Security Alerts</h3>
          
          {userAlerts.length === 0 ? (
            <p className="text-center py-6 text-gray-500">
              No security alerts found for your account
            </p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {userAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-3 border rounded-lg flex items-center justify-between ${
                      alert.severity === 'critical' || alert.severity === 'high'
                        ? 'bg-red-50 border-red-200'
                        : alert.severity === 'medium'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center">
                        <AlertTriangle className={`h-4 w-4 mr-2 ${
                          alert.severity === 'critical' || alert.severity === 'high'
                            ? 'text-red-600'
                            : alert.severity === 'medium'
                            ? 'text-amber-600'
                            : 'text-blue-600'
                        }`} />
                        <p className="font-medium">{alert.ruleName}</p>
                        <Badge className="ml-2 text-xs">{alert.severity}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Detected {formatDate(alert.detectedAt)}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewAlert(alert)}
                    >
                      Details
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <p className="text-xs text-gray-500">
            Last updated: {refreshing ? 'Updating...' : new Date().toLocaleString()}
          </p>
          <Button variant="link" size="sm" asChild>
            <a href="/dashboard/security" className="flex items-center">
              <span className="mr-1">Security center</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </CardFooter>
      </Card>

      {/* Alert Details Dialog */}
      <Dialog open={alertDetailsOpen} onOpenChange={setAlertDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {selectedAlert?.ruleName}
            </DialogTitle>
            <DialogDescription>
              Alert details
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="font-medium">Severity:</p>
                  <Badge className={`mt-1 ${
                    selectedAlert.severity === 'critical' || selectedAlert.severity === 'high'
                      ? 'bg-red-100 text-red-800'
                      : selectedAlert.severity === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedAlert.severity}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium">Status:</p>
                  <p>{selectedAlert.status}</p>
                </div>
                <div>
                  <p className="font-medium">Detected:</p>
                  <p>{formatDate(selectedAlert.detectedAt)}</p>
                </div>
                <div>
                  <p className="font-medium">Transactions:</p>
                  <p>{selectedAlert.transactions.length} involved</p>
                </div>
              </div>

              {selectedAlert.resolution && (
                <div className="mt-2">
                  <p className="font-medium">Resolution:</p>
                  <p className="text-sm mt-1">{selectedAlert.resolution}</p>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>What should I do?</AlertTitle>
                <AlertDescription className="text-sm">
                  If you recognize this activity as legitimate, no action is required.
                  If you don't recognize this activity, please contact support immediately.
                </AlertDescription>
              </Alert>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setAlertDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button asChild>
                  <a href="/dashboard/support">Contact Support</a>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
