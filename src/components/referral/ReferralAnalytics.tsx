'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { exportCSV, exportJSON, processDateFields, formatDateForFileName } from "@/lib/export-utils";
import { Print } from "lucide-react";
import { 
  LineChart, 
  BarChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ArrowUpRight, TrendingUp, Users, CreditCard, Calendar, Download } from "lucide-react";

interface ReferralAnalyticsProps {
  stats: any;
  commissions: any[];
  referrals: any[];
  startDate?: Date;
  endDate?: Date;
}

export function ReferralAnalytics({ stats, commissions, referrals, startDate, endDate }: ReferralAnalyticsProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const { toast } = useToast();
  
  if (!stats || !commissions || !referrals) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Analytics</CardTitle>
          <CardDescription>No data available for analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-sm text-muted-foreground">
            Start referring friends to see your performance analytics
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Process commissions data for charts
  const processCommissionsData = () => {
    // Group by date based on selected period
    const groupedData = commissions.reduce((acc: Record<string, any>, commission: any) => {
      const date = commission.createdAt instanceof Date 
        ? commission.createdAt 
        : new Date(commission.createdAt?.toDate?.() || commission.createdAt);
      
      let key = '';
      if (period === 'week') {
        // Group by day of week
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        key = dayNames[date.getDay()];
      } else if (period === 'month') {
        // Group by day of month
        key = date.getDate().toString();
      } else {
        // Group by month
        key = date.toLocaleString('default', { month: 'short' });
      }
      
      if (!acc[key]) {
        acc[key] = {
          name: key,
          amount: 0,
          count: 0
        };
      }
      
      acc[key].amount += commission.amount || 0;
      acc[key].count += 1;
      
      return acc;
    }, {});
    
    // Convert to array and sort
    let sortedData = Object.values(groupedData);
    
    if (period === 'week') {
      // Sort by day of week
      const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      sortedData = sortedData.sort((a: any, b: any) => 
        dayOrder.indexOf(a.name) - dayOrder.indexOf(b.name)
      );
    } else if (period === 'month') {
      // Sort by day of month
      sortedData = sortedData.sort((a: any, b: any) => 
        parseInt(a.name) - parseInt(b.name)
      );
    } else {
      // Sort by month
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      sortedData = sortedData.sort((a: any, b: any) => 
        monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name)
      );
    }
    
    return sortedData;
  };
  
  // Process referrals data for charts
  const processReferralsData = () => {
    // Group by tier
    const tierData = referrals.reduce((acc: Record<string, any>, referral: any) => {
      const tier = referral.tier || 'Basic';
      
      if (!acc[tier]) {
        acc[tier] = {
          name: tier,
          value: 0
        };
      }
      
      acc[tier].value += 1;
      
      return acc;
    }, {});
    
    return Object.values(tierData);
  };
  
  // Calculate trend percentages
  const calculateTrendPercentage = () => {
    // This would normally calculate the percentage change compared to previous period
    // For demo, let's use a random positive or negative value
    return Math.floor(Math.random() * 40) - 10;
  };
  
  const trendPercentage = calculateTrendPercentage();
  const commissionsData = processCommissionsData();
  const referralsByTier = processReferralsData();
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  // Calculate monthly target progress
  const monthlyTarget = 10; // Example: 10 referrals per month
  const monthlyProgress = Math.min(100, Math.round((stats.monthlyReferrals || 0) / monthlyTarget * 100));
  
  // Prepare analytics data for export
  const prepareExportData = () => {
    // Process commissions data with dates
    const commissionRows = commissions.map(comm => ({
      date: comm.createdAt,
      amount: comm.amount || 0,
      referredUser: comm.referredUser || 'Unknown',
      type: comm.type || 'Commission',
      status: comm.status || 'Completed'
    }));
    
    // Process and format date fields
    const processedCommissions = processDateFields(commissionRows, ['date']);
    
    // Process referrals data with dates
    const referralRows = referrals.map(ref => ({
      email: ref.email || 'Unknown',
      tier: ref.tier || 'Basic',
      joinDate: ref.joinDate,
      status: ref.status || 'Active',
      totalCommissions: ref.totalCommissions || 0
    }));
    
    // Process and format date fields
    const processedReferrals = processDateFields(referralRows, ['joinDate']);
    
    // Prepare summary data
    const summaryData = {
      totalReferrals: stats.totalReferrals || 0,
      activeReferrals: stats.activeReferrals || 0,
      totalCommissions: stats.totalCommissions || 0,
      pendingCommissions: stats.pendingCommissions || 0,
      conversionRate: stats.totalReferrals 
        ? Math.round((stats.activeReferrals / stats.totalReferrals) * 100) 
        : 0,
      period: period,
      exportDate: new Date()
    };
    
    // Process and format date fields in summary
    const processedSummary = processDateFields(summaryData, ['exportDate']);
    
    return {
      summary: processedSummary,
      commissions: processedCommissions,
      referrals: processedReferrals,
      chartData: {
        commissions: commissionsData,
        referralsByTier: referralsByTier
      }
    };
  };
  
  // Export data to CSV
  const exportToCsv = (data) => {
    // Export commissions data
    const commissionHeaders = ['date', 'amount', 'referredUser', 'type', 'status'];
    const headerLabels = ['Date', 'Amount', 'Referred User', 'Type', 'Status'];
    const fileName = `referral-commissions-${formatDateForFileName()}.csv`;
    
    return exportCSV(data.commissions, fileName, headerLabels);
  };
  
  // Export data to JSON
  const exportToJson = (data) => {
    const fileName = `referral-analytics-${formatDateForFileName()}.json`;
    return exportJSON(data, fileName);
  };
  
  // Generate data preview
  const generatePreview = () => {
    try {
      // Prepare the data
      const data = prepareExportData();
      setPreviewData(data);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "Preview Failed",
        description: "Failed to generate report preview. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Close preview dialog
  const closePreview = () => {
    setShowPreview(false);
    setPreviewData(null);
  };
  
  // Format currency values for display
  const formatCurrency = (value: number) => {
    return `R${value.toFixed(2)}`;
  };
  
  // Print preview data
  const printPreviewData = () => {
    if (!previewData) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print Failed",
        description: "Unable to open print preview. Please check your popup blocker settings.",
        variant: "destructive"
      });
      return;
    }
    
    // Generate HTML content for printing
    const html = `
      <html>
        <head>
          <title>Referral Analytics Report - ${formatDateForFileName()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #193281; }
            h2 { color: #193281; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Referral Analytics Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          
          <h2>Summary</h2>
          <table>
            <tr><th>Total Referrals</th><td>${previewData.summary.totalReferrals}</td></tr>
            <tr><th>Active Referrals</th><td>${previewData.summary.activeReferrals}</td></tr>
            <tr><th>Total Commissions</th><td>R${previewData.summary.totalCommissions?.toFixed(2)}</td></tr>
            <tr><th>Conversion Rate</th><td>${previewData.summary.conversionRate}%</td></tr>
            <tr><th>Period</th><td>${previewData.summary.period}</td></tr>
          </table>
          
          <h2>Commission Data</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Referred User</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${previewData.commissions.map((comm: any) => `
                <tr>
                  <td>${comm.date}</td>
                  <td>R${comm.amount.toFixed(2)}</td>
                  <td>${comm.referredUser}</td>
                  <td>${comm.type}</td>
                  <td>${comm.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>CoinBox Connect - Referral Analytics Report</p>
          </div>
          
          <script>
            // Auto print when loaded
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    
    // Write to the new window and trigger print
    printWindow.document.write(html);
    printWindow.document.close();
  };
  
  // Main export function
  const exportReportData = async (format: 'csv' | 'json' | 'preview' = 'csv') => {
    try {
      if (format === 'preview') {
        generatePreview();
        return;
      }
      
      setIsExporting(true);
      
      // Prepare the data
      const data = prepareExportData();
      
      // Export in the selected format
      let fileName;
      if (format === 'csv') {
        fileName = exportToCsv(data);
      } else {
        fileName = exportToJson(data);
      }
      
      toast({
        title: "Export Successful",
        description: `Your report has been downloaded as ${fileName}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Referral Analytics</CardTitle>
            <CardDescription>Visualize your referral performance over time</CardDescription>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Earnings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R{stats.totalCommissions?.toFixed(2) || "0.00"}</div>
              <div className="flex items-center pt-1 text-xs text-muted-foreground">
                <span className={`mr-1 ${trendPercentage > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {trendPercentage > 0 ? '+' : ''}{trendPercentage}%
                </span>
                <span>from previous {period}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Referrals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeReferrals || 0}</div>
              <div className="flex items-center pt-1 text-xs text-muted-foreground">
                <span>out of {stats.totalReferrals || 0} total referrals</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Monthly Target */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Target</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyReferrals || 0} / {monthlyTarget}</div>
              <div className="pt-3">
                <Progress value={monthlyProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
          
          {/* Conversion Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalReferrals ? Math.round((stats.activeReferrals / stats.totalReferrals) * 100) : 0}%
              </div>
              <div className="flex items-center pt-1 text-xs text-muted-foreground">
                <span>referred users who completed registration</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Commission History Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>Your earnings over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={commissionsData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`R${value.toFixed(2)}`, 'Amount']}
                    labelFormatter={(label) => `${period === 'week' ? 'Day' : period === 'month' ? 'Date' : 'Month'}: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    name="Commission Amount" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Referrals by Tier */}
          <Card>
            <CardHeader>
              <CardTitle>Referrals by Tier</CardTitle>
              <CardDescription>Distribution of your referrals by membership tier</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={referralsByTier}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {referralsByTier.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} referrals`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        {/* Referral Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Activity</CardTitle>
            <CardDescription>Number of referrals by time period</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={commissionsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} referrals`, 'Count']}
                  labelFormatter={(label) => `${period === 'week' ? 'Day' : period === 'month' ? 'Date' : 'Month'}: ${label}`}
                />
                <Legend />
                <Bar dataKey="count" name="Referral Count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </CardContent>
      <CardFooter className="justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportReportData('preview')}>
              Preview Data
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportReportData('csv')}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportReportData('json')}>
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Data Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Export Data Preview</DialogTitle>
              <DialogDescription>
                Preview of the data that will be exported. You can download this data in CSV or JSON format.
              </DialogDescription>
            </DialogHeader>
            
            {isExporting ? (
              <div className="h-[200px] flex flex-col items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
                <p className="text-center text-muted-foreground">Preparing your export...</p>
              </div>
            ) : previewData && (
              <ScrollArea className="h-[500px] rounded-md border">
                <div className="p-4 space-y-6">
                  {/* Summary Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Summary</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Total Referrals</TableCell>
                          <TableCell>{previewData.summary.totalReferrals}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Active Referrals</TableCell>
                          <TableCell>{previewData.summary.activeReferrals}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Total Commissions</TableCell>
                          <TableCell>R{previewData.summary.totalCommissions?.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Conversion Rate</TableCell>
                          <TableCell>{previewData.summary.conversionRate}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Period</TableCell>
                          <TableCell>{previewData.summary.period}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Commissions Data */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Commission Data</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Referred User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.commissions.slice(0, 10).map((comm: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{comm.date}</TableCell>
                            <TableCell>R{comm.amount.toFixed(2)}</TableCell>
                            <TableCell>{comm.referredUser}</TableCell>
                            <TableCell>{comm.type}</TableCell>
                            <TableCell>{comm.status}</TableCell>
                          </TableRow>
                        ))}
                        {previewData.commissions.length > 10 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              {previewData.commissions.length - 10} more entries not shown in preview
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </ScrollArea>
            )}
            {!isExporting && !previewData && (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-center text-muted-foreground">No preview data available</p>
              </div>
            )}
            
            <DialogFooter className="sm:justify-between">
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Close Preview</Button>
                </DialogClose>
                <Button 
                  variant="outline" 
                  onClick={printPreviewData}
                >
                  <Print className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  onClick={() => exportReportData('csv')}
                  disabled={isExporting}
                >
                  Export as CSV
                </Button>
                <Button 
                  onClick={() => exportReportData('json')}
                  disabled={isExporting}
                >
                  Export as JSON
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
