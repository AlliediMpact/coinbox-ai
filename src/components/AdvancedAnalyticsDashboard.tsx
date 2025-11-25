'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  CreditCard,
  AlertTriangle,
  Download,
  Calendar,
  RefreshCw,
  Eye,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { advancedAnalyticsService, AnalyticsMetrics, PredictiveAnalytics } from '@/lib/advanced-analytics-service';

const COLORS = ['#193281', '#5e17eb', '#cb6ce6', '#8b5cf6', '#a855f7', '#c084fc'];

export default function AdvancedAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [predictions, setPredictions] = useState<PredictiveAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedView, setSelectedView] = useState('overview');
  const [realtimeData, setRealtimeData] = useState<any>(null);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await advancedAnalyticsService.getAnalyticsMetrics({
        dateRange: {
          start: new Date(Date.now() - getTimeRangeMs(timeRange)),
          end: new Date()
        }
      });
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const loadPredictiveData = async () => {
    try {
      const data = await advancedAnalyticsService.getPredictiveAnalytics(30);
      setPredictions(data);
    } catch (error) {
      console.error('Failed to load predictive data:', error);
    }
  };

  const loadRealtimeData = useCallback(async () => {
    try {
      const data = await advancedAnalyticsService.getRealtimeMetrics();
      setRealtimeData(data);
    } catch (error) {
      console.error('Failed to load realtime data:', error);
    }
  }, []);

  useEffect(() => {
    loadAnalyticsData();
    loadPredictiveData();
    loadRealtimeData();

    // Set up real-time data updates
    const interval = setInterval(loadRealtimeData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [loadAnalyticsData, loadRealtimeData]);

  const getTimeRangeMs = (range: string): number => {
    const ranges = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };
    return ranges[range as keyof typeof ranges] || ranges['30d'];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const membershipTierData = useMemo(() => {
    if (!metrics || !metrics.users || !metrics.users.byMembershipTier) return [];
    const total = metrics.users.total || 1;
    return Object.entries(metrics.users.byMembershipTier).map(([tier, count]) => ({
      name: tier,
      value: count,
      percentage: ((count / total) * 100).toFixed(1)
    }));
  }, [metrics]);

  const transactionTrendData = useMemo(() => {
    if (!metrics || !metrics.transactions || !metrics.transactions.monthlyTrend) return [];
    return metrics.transactions.monthlyTrend.map(item => ({
      ...item,
      volume: (item.volume || 0) / 1000 // Convert to thousands
    }));
  }, [metrics]);

  const revenueData = useMemo(() => {
    if (!metrics || !metrics.financial || !metrics.financial.revenue || !metrics.financial.revenue.bySource) return [];
    const totalRevenue = metrics.financial.revenue.total || 1;
    return Object.entries(metrics.financial.revenue.bySource).map(([source, amount]) => ({
      name: source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: amount,
      percentage: ((amount / totalRevenue) * 100).toFixed(1)
    }));
  }, [metrics]);

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
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Analytics</h2>
          <p className="text-gray-600 mb-4">There was an error loading the analytics dashboard.</p>
          <Button onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="advanced-analytics max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Analytics</h1>
          <p className="text-gray-600">Comprehensive platform insights and predictive analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalyticsData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => window.print()} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-time Status Bar */}
      {realtimeData && (
        <Card className="mb-6 border-l-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Live</span>
                  <Badge variant="outline">{realtimeData.activeUsers} active users</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {realtimeData.ongoingTransactions} ongoing transactions
                </div>
                <div className="text-sm text-gray-600">
                  System load: {realtimeData.systemLoad.toFixed(1)}%
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{metrics.users.total.toLocaleString()}</span>
              <div className="flex items-center text-green-600 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                +{formatPercentage((metrics.users.newThisMonth / metrics.users.total) * 100)}
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {metrics.users.active.toLocaleString()} active • {formatPercentage(metrics.users.retentionRate)} retention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Transaction Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{formatCurrency(metrics.transactions.volume)}</span>
              <div className="flex items-center text-green-600 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                {formatPercentage(metrics.transactions.successRate)}
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {metrics.transactions.total.toLocaleString()} transactions • {formatCurrency(metrics.transactions.averageAmount)} avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{formatCurrency(metrics.financial.revenue.total)}</span>
              <div className="flex items-center text-green-600 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                {formatPercentage(metrics.financial.margins)}
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {formatCurrency(metrics.financial.revenue.monthly)} monthly • {formatPercentage(metrics.financial.margins)} margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Loan Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{formatPercentage(100 - metrics.loans.defaultRate)}</span>
              <div className="flex items-center text-green-600 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                {formatPercentage(metrics.loans.repaymentRate)}
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {metrics.loans.totalIssued.toLocaleString()} loans • {formatCurrency(metrics.loans.averageAmount)} avg
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transaction Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Trends</CardTitle>
                <CardDescription>Monthly transaction count and volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={transactionTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="count"
                      stackId="1"
                      stroke="#193281"
                      fill="#193281"
                      fillOpacity={0.6}
                      name="Transaction Count"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="volume"
                      stroke="#5e17eb"
                      strokeWidth={2}
                      name="Volume (K)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Membership Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Membership Distribution</CardTitle>
                <CardDescription>User distribution by membership tier</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={membershipTierData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {membershipTierData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
                <CardDescription>Revenue breakdown by source</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="value" fill="#5e17eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Commission Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Commission Performance</CardTitle>
                <CardDescription>Monthly commission payouts</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.commissions.monthlyPayouts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#cb6ce6"
                      strokeWidth={2}
                      name="Payout Amount"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User analytics content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>User acquisition and retention trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  User growth charts would be rendered here
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="font-bold">{metrics.users.active.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New This Month</span>
                  <span className="font-bold text-green-600">+{metrics.users.newThisMonth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Retention Rate</span>
                  <span className="font-bold">{formatPercentage(metrics.users.retentionRate)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Transaction analytics content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Types</CardTitle>
                <CardDescription>Distribution of transaction types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.transactions.byType).map(([type, data]) => (
                    <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{type.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-600">{data.count.toLocaleString()} transactions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(data.volume)}</p>
                        <p className="text-sm text-gray-600">
                          {formatPercentage((data.volume / metrics.transactions.volume) * 100)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Metrics</CardTitle>
                <CardDescription>Transaction success and failure rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-bold text-green-600">{formatPercentage(metrics.transactions.successRate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Amount</span>
                    <span className="font-bold">{formatCurrency(metrics.transactions.averageAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Volume</span>
                    <span className="font-bold">{formatCurrency(metrics.transactions.volume)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {/* Financial analytics content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{formatCurrency(metrics.financial.revenue.total)}</p>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monthly</span>
                    <span className="font-bold">{formatCurrency(metrics.financial.revenue.monthly)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Commissions</span>
                    <span className="font-bold">{formatCurrency(metrics.financial.costs.commissions)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Operational</span>
                    <span className="font-bold">{formatCurrency(metrics.financial.costs.operational)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Defaults</span>
                    <span className="font-bold text-red-600">{formatCurrency(metrics.financial.costs.defaults)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profitability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(metrics.financial.profit)}</p>
                    <p className="text-sm text-gray-600">Net Profit</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Profit Margin</span>
                    <span className="font-bold">{formatPercentage(metrics.financial.margins)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          {/* Predictive analytics content */}
          {predictions ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth Prediction</CardTitle>
                  <CardDescription>30-day user growth forecast</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{predictions.userGrowth.trend}</Badge>
                      <span className="text-sm text-gray-600">
                        {formatPercentage(predictions.userGrowth.confidence)} confidence
                      </span>
                    </div>
                    <div className="h-32 flex items-center justify-center text-gray-500">
                      Prediction chart would be rendered here
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Default Risk Prediction</CardTitle>
                  <CardDescription>Predicted default rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-orange-600">
                        {formatPercentage(predictions.defaultRisk.prediction)}
                      </p>
                      <p className="text-sm text-gray-600">Predicted Default Rate</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Risk Factors:</h4>
                      {predictions.defaultRisk.riskFactors.map((factor, index) => (
                        <Badge key={index} variant="secondary" className="mr-2">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Revenue Forecast</CardTitle>
                  <CardDescription>Revenue prediction with scenarios</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-center gap-8">
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">Optimistic</p>
                        <p className="text-sm text-gray-600">+20% scenario</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">Realistic</p>
                        <p className="text-sm text-gray-600">Base scenario</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-orange-600">Pessimistic</p>
                        <p className="text-sm text-gray-600">-20% scenario</p>
                      </div>
                    </div>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      Revenue forecast chart would be rendered here
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
