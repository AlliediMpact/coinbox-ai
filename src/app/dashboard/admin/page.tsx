'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdvancedAnalyticsDashboard from '@/components/AdvancedAnalyticsDashboard';
import AdvancedComplianceTools from '@/components/AdvancedComplianceTools';
import PerformanceDashboard from '@/components/PerformanceDashboard';
import { 
  Shield, 
  CreditCard, 
  Users, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  Database
} from 'lucide-react';

interface AdminStats {
  kyc: {
    pending: number;
    approved: number;
    rejected: number;
    totalVerifications: number;
  };
  commissions: {
    pending: number;
    totalPendingAmount: number;
    schedulerRunning: boolean;
    lastPayout: Date | null;
  };
  payments: {
    totalTransactions: number;
    totalVolume: number;
    failedPayments: number;
    pendingRefunds: number;
  };
  system: {
    alerts: number;
    uptime: string;
    lastBackup: Date | null;
  };
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      loadAdminStats();
    }
  }, [user]);

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would fetch from admin APIs
      // For now, using mock data to demonstrate the interface
      const mockStats: AdminStats = {
        kyc: {
          pending: 23,
          approved: 157,
          rejected: 8,
          totalVerifications: 188
        },
        commissions: {
          pending: 45,
          totalPendingAmount: 2847.50,
          schedulerRunning: true,
          lastPayout: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        },
        payments: {
          totalTransactions: 1250,
          totalVolume: 45678.90,
          failedPayments: 12,
          pendingRefunds: 3
        },
        system: {
          alerts: 2,
          uptime: '99.8%',
          lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
        }
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKycAction = async (action: string, params?: any) => {
    try {
      console.log('KYC Action:', action, params);
      // Call admin KYC API
    } catch (error) {
      console.error('KYC action failed:', error);
    }
  };

  const handleCommissionAction = async (action: string) => {
    try {
      console.log('Commission Action:', action);
      // Call admin commission API
      await loadAdminStats(); // Refresh stats
    } catch (error) {
      console.error('Commission action failed:', error);
    }
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Admin Data</h2>
          <p className="text-gray-600 mb-4">There was an error loading the admin dashboard.</p>
          <Button onClick={loadAdminStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Monitor and manage platform operations</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">KYC Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats.kyc.pending}</span>
              <Shield className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.kyc.totalVerifications} total verifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{formatCurrency(stats.commissions.totalPendingAmount)}</span>
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.commissions.pending} pending payouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Payment Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{formatCurrency(stats.payments.totalVolume)}</span>
              <CreditCard className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.payments.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats.system.uptime}</span>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.system.alerts} active alerts
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent KYC Submissions</CardTitle>
                <CardDescription>Latest identity verification requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { id: 1, user: 'john.doe@email.com', status: 'pending', time: '2 hours ago' },
                    { id: 2, user: 'jane.smith@email.com', status: 'approved', time: '4 hours ago' },
                    { id: 3, user: 'mike.wilson@email.com', status: 'rejected', time: '6 hours ago' }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.user}</p>
                        <p className="text-xs text-gray-600">{item.time}</p>
                      </div>
                      <Badge 
                        variant={
                          item.status === 'approved' ? 'default' : 
                          item.status === 'rejected' ? 'destructive' : 'secondary'
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setActiveTab('kyc')}
                  >
                    View All KYC Requests
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Commission Scheduler</CardTitle>
                <CardDescription>Automated commission payout system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {stats.commissions.schedulerRunning ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">Scheduler Status</p>
                        <p className="text-sm text-gray-600">
                          {stats.commissions.schedulerRunning ? 'Running' : 'Stopped'}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={stats.commissions.schedulerRunning ? "destructive" : "default"}
                      onClick={() => handleCommissionAction(stats.commissions.schedulerRunning ? 'stop' : 'start')}
                    >
                      {stats.commissions.schedulerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => handleCommissionAction('trigger')}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Trigger Manual Payout
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('commissions')}
                    >
                      View Commission Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kyc" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>KYC Management</CardTitle>
              <CardDescription>Review and approve identity verifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button onClick={() => handleKycAction('refresh')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" onClick={() => handleKycAction('export')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
              
              <div className="text-center py-8 text-gray-600">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>KYC management interface would be implemented here</p>
                <p className="text-sm">Including document review, approval/rejection, and bulk actions</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission Management</CardTitle>
              <CardDescription>Monitor and manage referral commissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats.commissions.pending}</p>
                  <p className="text-sm text-gray-600">Pending Payouts</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.commissions.totalPendingAmount)}</p>
                  <p className="text-sm text-gray-600">Total Amount</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.commissions.lastPayout ? 
                      new Date(stats.commissions.lastPayout).toLocaleDateString() : 'Never'}
                  </p>
                  <p className="text-sm text-gray-600">Last Payout</p>
                </div>
              </div>

              <div className="text-center py-8 text-gray-600">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Commission management interface would be implemented here</p>
                <p className="text-sm">Including payout history, referral tracking, and leaderboards</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>Monitor payment transactions and receipts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats.payments.totalTransactions}</p>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.payments.totalVolume)}</p>
                  <p className="text-sm text-gray-600">Total Volume</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{stats.payments.failedPayments}</p>
                  <p className="text-sm text-gray-600">Failed Payments</p>
                </div>
              </div>

              <div className="text-center py-8 text-gray-600">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Payment management interface would be implemented here</p>
                <p className="text-sm">Including transaction monitoring, refund processing, and analytics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AdvancedAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceDashboard />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceDashboard />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <AdvancedComplianceTools />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">{/* ...existing system content... */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Monitor platform performance and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">System Status</p>
                        <p className="text-sm text-gray-600">All services operational</p>
                      </div>
                    </div>
                    <Badge variant="default">Online</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Uptime</p>
                        <p className="text-sm text-gray-600">{stats.system.uptime}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium">Last Backup</p>
                        <p className="text-sm text-gray-600">
                          {stats.system.lastBackup ? stats.system.lastBackup.toLocaleDateString() : 'No backup found'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {stats.system.alerts > 0 && (
                    <div className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium text-red-800">System Alerts</p>
                          <p className="text-sm text-red-600">{stats.system.alerts} active alerts</p>
                        </div>
                      </div>
                      <Button variant="destructive" size="sm">
                        View Alerts
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Controls</CardTitle>
                <CardDescription>Administrative system management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => console.log('Manual backup initiated')}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Run Manual Backup
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Dashboard
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => console.log('Cache cleared')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => console.log('Export logs')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export System Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
