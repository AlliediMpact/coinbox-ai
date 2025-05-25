import { useState, useEffect } from 'react';
import { analyticsService } from '@/lib/analytics-service';
import { analyticsExportService } from '@/lib/analytics-export-service';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  DollarSign,
  Users,
  Activity,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Loader2
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Analytics Dashboard Component
export default function AnalyticsDashboard() {
  const { toast } = useToast();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const platformMetrics = await analyticsService.getPlatformMetrics(period);
        setMetrics(platformMetrics);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        toast({
          title: 'Error',
          description: 'Failed to load analytics data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [period, toast]);

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const platformMetrics = await analyticsService.getPlatformMetrics(period);
      setMetrics(platformMetrics);
      toast({
        title: 'Data Refreshed',
        description: 'Analytics data has been updated'
      });
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh analytics data',
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Generate export
  const handleExport = async (reportType: 'transactions' | 'users' | 'revenue' | 'system', format: 'csv' | 'json' | 'pdf' | 'excel') => {
    try {
      toast({
        title: 'Exporting Data',
        description: 'Your export is being prepared'
      });

      setIsExporting(true);
      
      // Call the export service based on report type
      let fileName: string;
      
      try {
        switch (reportType) {
          case 'transactions':
            fileName = await analyticsExportService.exportTransactions({
              format,
              startDate: getStartDateForPeriod(period),
              endDate: new Date()
            });
            break;
            
          case 'users':
            fileName = await analyticsExportService.exportUserGrowth({
              format
            });
            break;
            
          case 'revenue':
            fileName = await analyticsExportService.exportRevenue({
              format
            });
            break;
            
          case 'system':
            fileName = await analyticsExportService.exportSystemPerformance({
              format
            });
            break;
        }
        
        toast({
          title: 'Export Complete',
          description: `Your data has been exported to ${fileName}`
        });
      } catch (innerError) {
        console.error('Failed to export data:', innerError);
        toast({
          title: 'Export Failed',
          description: 'Failed to generate export file',
          variant: 'destructive'
        });
      } finally {
        setIsExporting(false);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to generate export',
        variant: 'destructive'
      });
      setIsExporting(false);
    }
  };

  // Get start date for period
  const getStartDateForPeriod = (p: 'week' | 'month' | 'quarter'): Date => {
    const date = new Date();
    switch (p) {
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'quarter':
        date.setMonth(date.getMonth() - 3);
        break;
    }
    return date;
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(value);
  };

  // Display change percentage with arrow
  const renderChangeIndicator = (percentChange: number) => {
    const isPositive = percentChange > 0;
    const isNeutral = percentChange === 0;
    
    return (
      <div className={`flex items-center ${
        isPositive ? 'text-green-500' : 
        isNeutral ? 'text-gray-500' : 
        'text-red-500'
      }`}>
        {isPositive ? (
          <ArrowUpRight className="h-4 w-4 mr-1" />
        ) : isNeutral ? (
          <ArrowRight className="h-4 w-4 mr-1" />
        ) : (
          <ArrowDownRight className="h-4 w-4 mr-1" />
        )}
        <span>{Math.abs(percentChange).toFixed(1)}%</span>
      </div>
    );
  };

  // Sample dispute data for chart
  const disputeStatusData = [
    { name: 'Open', value: metrics?.disputes?.openDisputes || 0 },
    { name: 'Resolved', value: metrics?.disputes?.resolvedDisputes || 0 }
  ];

  // Sample transaction data for chart
  const transactionData = [
    { name: 'Jan', volume: 4000 },
    { name: 'Feb', volume: 3000 },
    { name: 'Mar', volume: 5000 },
    { name: 'Apr', volume: 7000 },
    { name: 'May', volume: 6000 },
    { name: 'Jun', volume: 8000 }
  ];

  // Sample user activity data for chart
  const userActivityData = [
    { name: 'Mon', active: 120 },
    { name: 'Tue', active: 150 },
    { name: 'Wed', active: 180 },
    { name: 'Thu', active: 170 },
    { name: 'Fri', active: 200 },
    { name: 'Sat', active: 220 },
    { name: 'Sun', active: 190 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and reporting for CoinBox
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Transaction Volume */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">
                    Transaction Volume
                  </CardTitle>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-[120px]" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {formatCurrency(metrics?.transactions?.totalVolume || 0)}
                    </div>
                  )}
                  {isLoading ? (
                    <Skeleton className="h-4 w-[80px] mt-1" />
                  ) : (
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      {renderChangeIndicator(metrics?.transactions?.percentChange || 0)}
                      <span className="ml-1">from previous period</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Active Users */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">
                    Active Users
                  </CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-[80px]" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {metrics?.users?.activeUsers?.toLocaleString() || 0}
                    </div>
                  )}
                  {isLoading ? (
                    <Skeleton className="h-4 w-[80px] mt-1" />
                  ) : (
                    <div className="flex flex-col">
                      <p className="text-xs text-muted-foreground mt-1">
                        {metrics?.users?.newUsers || 0} new users
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(metrics?.users?.retentionRate * 100).toFixed(1)}% retention rate
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dispute Rate */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">
                    Dispute Rate
                  </CardTitle>
                  <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-[60px]" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {(metrics?.disputes?.disputeRate * 100).toFixed(1)}%
                    </div>
                  )}
                  {isLoading ? (
                    <Skeleton className="h-4 w-[120px] mt-1" />
                  ) : (
                    <div className="flex flex-col">
                      <p className="text-xs text-muted-foreground mt-1">
                        {metrics?.disputes?.totalDisputes || 0} total disputes
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {metrics?.disputes?.openDisputes || 0} currently open
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">
                    System Health
                  </CardTitle>
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-[80px]" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {metrics?.systemHealth?.uptime.toFixed(1)}%
                    </div>
                  )}
                  {isLoading ? (
                    <Skeleton className="h-4 w-[100px] mt-1" />
                  ) : (
                    <div className="flex flex-col">
                      <p className="text-xs text-muted-foreground mt-1">
                        {metrics?.systemHealth?.responseTime || 0}ms response time
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(metrics?.systemHealth?.errorRate * 100).toFixed(2)}% error rate
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Transaction Volume Chart */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Transaction Volume Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="w-full h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                      <Loader2 className="h-8 w-8 animate-spin text-muted" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={transactionData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => [`R${value}`, 'Volume']}
                        />
                        <Legend />
                        <Bar dataKey="volume" fill="#8884d8" name="Transaction Volume" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Dispute Status Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Dispute Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="w-full h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                      <Loader2 className="h-8 w-8 animate-spin text-muted" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={disputeStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {disputeStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [value, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* User Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Activity (Last 7 days)</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="w-full h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                    <Loader2 className="h-8 w-8 animate-spin text-muted" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={userActivityData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="active" stroke="#8884d8" name="Active Users" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Analytics</CardTitle>
                <CardDescription>
                  Detailed transaction performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Transaction summary stats */}
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Total Transactions</h4>
                    {isLoading ? (
                      <Skeleton className="h-6 w-[100px]" />
                    ) : (
                      <p className="text-2xl font-bold">{metrics?.transactions?.totalTransactions?.toLocaleString()}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Average Amount</h4>
                    {isLoading ? (
                      <Skeleton className="h-6 w-[120px]" />
                    ) : (
                      <p className="text-2xl font-bold">{formatCurrency(metrics?.transactions?.averageAmount || 0)}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Success Rate</h4>
                    {isLoading ? (
                      <Skeleton className="h-6 w-[80px]" />
                    ) : (
                      <p className="text-2xl font-bold">
                        {(metrics?.transactions?.successRate * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Transaction trend chart */}
                {isLoading ? (
                  <div className="w-full h-[350px] flex items-center justify-center bg-muted/20 rounded-md">
                    <Loader2 className="h-8 w-8 animate-spin text-muted" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart
                      data={transactionData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [`R${value}`, 'Volume']} />
                      <Legend />
                      <Line type="monotone" dataKey="volume" stroke="#8884d8" name="Transaction Volume" />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('transactions', 'csv')}
                    disabled={isExporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('transactions', 'excel')}
                    disabled={isExporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? 'Exporting...' : 'Export Excel'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('transactions', 'json')}
                    disabled={isExporting}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {isExporting ? 'Exporting...' : 'Export JSON'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Analytics</CardTitle>
                <CardDescription>
                  User activity and engagement metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User metrics grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Active Users */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Skeleton className="h-8 w-[80px]" />
                      ) : (
                        <div className="text-2xl font-bold">{metrics?.users?.activeUsers?.toLocaleString()}</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* New Users */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">New Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Skeleton className="h-8 w-[80px]" />
                      ) : (
                        <div className="text-2xl font-bold">{metrics?.users?.newUsers?.toLocaleString()}</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Retention Rate */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Skeleton className="h-8 w-[80px]" />
                      ) : (
                        <div className="text-2xl font-bold">
                          {(metrics?.users?.retentionRate * 100).toFixed(1)}%
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Average Session Time */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Skeleton className="h-8 w-[80px]" />
                      ) : (
                        <div className="text-2xl font-bold">
                          {Math.round(metrics?.users?.avgSessionTime / 60) || 0} min
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* User activity chart */}
                <div>
                  <h3 className="font-medium mb-4">User Activity Trend</h3>
                  {isLoading ? (
                    <div className="w-full h-[350px] flex items-center justify-center bg-muted/20 rounded-md">
                      <Loader2 className="h-8 w-8 animate-spin text-muted" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart
                        data={userActivityData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="active" stroke="#8884d8" name="Active Users" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <Separator />

                {/* User activity hours */}
                <div>
                  <h3 className="font-medium mb-4">Most Active Hours</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {isLoading ? (
                      Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                      ))
                    ) : (
                      metrics?.users?.mostActiveHours?.map((hour: number, i: number) => (
                        <Card key={i} className="p-4 flex flex-col items-center justify-center">
                          <p className="text-2xl font-bold">{hour}:00</p>
                          <p className="text-xs text-muted-foreground">
                            {hour < 12 ? 'AM' : 'PM'}
                          </p>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dispute Analytics</CardTitle>
                <CardDescription>
                  Dispute resolution performance and trends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dispute metrics grid */}
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Total Disputes</h4>
                    {isLoading ? (
                      <Skeleton className="h-6 w-[80px]" />
                    ) : (
                      <p className="text-2xl font-bold">{metrics?.disputes?.totalDisputes?.toLocaleString()}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Avg Resolution Time</h4>
                    {isLoading ? (
                      <Skeleton className="h-6 w-[100px]" />
                    ) : (
                      <p className="text-2xl font-bold">
                        {Math.round(metrics?.disputes?.avgResolutionTime) || 0} hours
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Dispute Rate</h4>
                    {isLoading ? (
                      <Skeleton className="h-6 w-[80px]" />
                    ) : (
                      <p className="text-2xl font-bold">
                        {(metrics?.disputes?.disputeRate * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Dispute status breakdown */}
                <div>
                  <h3 className="font-medium mb-4">Dispute Status Breakdown</h3>
                  {isLoading ? (
                    <div className="w-full h-[350px] flex items-center justify-center bg-muted/20 rounded-md">
                      <Loader2 className="h-8 w-8 animate-spin text-muted" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={disputeStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {disputeStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [value, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <Separator />

                {/* Common dispute reasons */}
                <div>
                  <h3 className="font-medium mb-4">Common Dispute Reasons</h3>
                  {isLoading ? (
                    <div className="space-y-2">
                      {Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {metrics?.disputes?.commonReasons?.map((reason: any, i: number) => (
                        <div key={i} className="flex flex-col">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">{reason.reason}</span>
                            <span className="text-sm text-muted-foreground">
                              {reason.count} disputes
                            </span>
                          </div>
                          <Progress 
                            value={reason.count / (metrics?.disputes?.totalDisputes || 1) * 100} 
                            className="h-2" 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
