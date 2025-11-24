'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs,
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Calendar as CalendarIcon, AlertTriangle, BarChart3 } from "lucide-react";
import { complianceReportingService } from '@/lib/compliance-reporting-service';
import { useToast } from "@/components/ui/use-toast";
import TransactionExport from '../TransactionExport';

export default function ComplianceDashboard() {
  const { user, userClaims } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'quarterly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reportFormat, setReportFormat] = useState<'json' | 'csv' | 'pdf' | 'xlsx'>('pdf');
  const [reports, setReports] = useState<any[]>([]);
  const [activeReport, setActiveReport] = useState<any>(null);
  const [highValueTransactions, setHighValueTransactions] = useState<any[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<any>({
    totalTransactions: 0,
    totalValue: 0,
    highValueCount: 0,
    flaggedCount: 0,
    complianceScore: 0
  });
  
  // Check if user has admin access
  const isAdmin = userClaims?.role === 'admin';
  
  const loadReportsList = useCallback(async () => {
    try {
      setLoading(true);
      
      // This would call an admin API endpoint to fetch recent reports
      // For now, let's create some mock data
      const mockReports = [
        {
          id: 'report_monthly_20240421_20240521_1684645123456',
          reportType: 'monthly',
          generatedAt: new Date(Date.now() - 86400000),
          period: {
            startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
            endDate: new Date()
          },
          generatedBy: 'admin@example.com',
          summary: {
            totalTransactions: 421,
            totalTransactionValue: 136792.45,
            highValueTransactions: 8,
            flaggedTransactions: 3,
            complianceScore: 94
          }
        },
        {
          id: 'report_quarterly_20240201_20240501_1684555123456',
          reportType: 'quarterly',
          generatedAt: new Date(Date.now() - 7 * 86400000),
          period: {
            startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
            endDate: new Date(new Date().setDate(new Date().getDate() - 7))
          },
          generatedBy: 'admin@example.com',
          summary: {
            totalTransactions: 1247,
            totalTransactionValue: 428976.32,
            highValueTransactions: 24,
            flaggedTransactions: 12,
            complianceScore: 89
          }
        }
      ];
      
      setReports(mockReports);
      
    } catch (error) {
      console.error('Failed to load compliance reports:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load compliance reports. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const loadSummaryMetrics = useCallback(async () => {
    try {
      setLoading(true);
      
      // This would call an admin API endpoint to fetch current metrics
      // For now, let's use mock data
      const mockSummary = {
        totalTransactions: 18426,
        totalValue: 5832417.89,
        highValueCount: 213,
        flaggedCount: 47,
        complianceScore: 92,
        recentActivity: [
          { date: new Date(Date.now() - 86400000), transactions: 124, value: 43215.67, flagged: 2 },
          { date: new Date(Date.now() - 2*86400000), transactions: 136, value: 47892.21, flagged: 1 },
          { date: new Date(Date.now() - 3*86400000), transactions: 152, value: 51438.59, flagged: 3 }
        ]
      };
      
      const mockHighValueTxns = [
        {
          id: 'txn_1684645128976',
          userId: 'user123',
          username: 'johndoe',
          amount: 24750.00,
          type: 'Invest',
          createdAt: new Date(Date.now() - 86400000),
          status: 'completed'
        },
        {
          id: 'txn_1684641234567',
          userId: 'user456',
          username: 'janedoe',
          amount: 18500.00,
          type: 'Escrow',
          createdAt: new Date(Date.now() - 2*86400000),
          status: 'completed'
        },
        {
          id: 'txn_1684637654321',
          userId: 'user789',
          username: 'bobsmith',
          amount: 15000.00,
          type: 'Invest',
          createdAt: new Date(Date.now() - 3*86400000),
          status: 'completed'
        }
      ];
      
      setSummaryMetrics(mockSummary);
      setHighValueTransactions(mockHighValueTxns);
      
    } catch (error) {
      console.error('Failed to load compliance metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && isAdmin) {
      loadReportsList();
      loadSummaryMetrics();
    }
  }, [user, isAdmin, loadReportsList, loadSummaryMetrics]);
  
  const generateReport = async () => {
    if (!user || !isAdmin) return;
    
    try {
      setGenerateLoading(true);
      
      toast({
        title: "Generating Report",
        description: "Your report is being generated. This may take a few moments."
      });
      
      // In a real implementation, this would call the compliance reporting service
      // For demo purposes, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReport = {
        id: `report_${reportType}_${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}_${Date.now()}`,
        reportType,
        generatedAt: new Date(),
        period: {
          startDate,
          endDate
        },
        generatedBy: user.email || 'admin@example.com',
        summary: {
          totalTransactions: Math.floor(Math.random() * 500) + 100,
          totalTransactionValue: Math.floor(Math.random() * 100000) + 10000,
          highValueTransactions: Math.floor(Math.random() * 10) + 1,
          flaggedTransactions: Math.floor(Math.random() * 5),
          complianceScore: Math.floor(Math.random() * 15) + 85
        }
      };
      
      setReports([newReport, ...reports]);
      setActiveReport(newReport);
      setActiveTab('reports');
      
      toast({
        title: "Report Generated",
        description: `Your ${reportType} report has been generated successfully.`
      });
      
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      toast({
        title: "Report Generation Failed",
        description: "There was an error generating your compliance report.",
        variant: "destructive",
      });
    } finally {
      setGenerateLoading(false);
    }
  };
  
  const viewReport = (report: any) => {
    setActiveReport(report);
    setActiveTab('report-details');
  };
  
  const downloadReport = (report: any, format: string) => {
    // In a real app, this would download the actual report
    toast({
      title: "Download Started",
      description: `Your report is being downloaded as ${format.toUpperCase()}`
    });
  };

  if (!user || !isAdmin) {
    return (
      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to access the compliance dashboard. Please contact an administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Compliance Dashboard</h2>
        <div className="text-sm text-muted-foreground">
          Last updated: {format(new Date(), 'PPP')}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Compliance Reports</TabsTrigger>
          <TabsTrigger value="report-details" disabled={!activeReport}>
            Report Details
          </TabsTrigger>
          <TabsTrigger value="transactions">High-Value Transactions</TabsTrigger>
          <TabsTrigger value="export">Export Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryMetrics.totalTransactions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Value: R{summaryMetrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">High-Value Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryMetrics.highValueCount}</div>
                <p className="text-xs text-muted-foreground">
                  {((summaryMetrics.highValueCount / summaryMetrics.totalTransactions) * 100).toFixed(2)}% of all transactions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summaryMetrics.complianceScore >= 90 ? 'text-green-500' : 
                summaryMetrics.complianceScore >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {summaryMetrics.complianceScore}/100
                </div>
                <p className="text-xs text-muted-foreground">
                  {summaryMetrics.complianceScore >= 90 ? 'Excellent' : 
                   summaryMetrics.complianceScore >= 80 ? 'Good' : 
                   summaryMetrics.complianceScore >= 70 ? 'Fair' : 'Poor'}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Generate New Compliance Report</CardTitle>
              <CardDescription>
                Create a new compliance report for regulatory or internal audit purposes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={reportType} onValueChange={(value) => setReportType(value as any)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Report</SelectItem>
                      <SelectItem value="monthly">Monthly Report</SelectItem>
                      <SelectItem value="quarterly">Quarterly Report</SelectItem>
                      <SelectItem value="custom">Custom Date Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Format</label>
                  <Select value={reportFormat} onValueChange={(value) => setReportFormat(value as any)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {reportType === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => date && setStartDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => date && setEndDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={generateReport} disabled={generateLoading} className="w-full">
                {generateLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2">◌</div>
                    Generating Report...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Generate {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                  </div>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports History</CardTitle>
              <CardDescription>
                View previously generated compliance reports and download them in various formats.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Type</TableHead>
                      <TableHead>Date Range</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="capitalize">{report.reportType}</TableCell>
                        <TableCell>
                          {format(new Date(report.period.startDate), 'MMM d, yyyy')} - {format(new Date(report.period.endDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{format(new Date(report.generatedAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{report.summary.totalTransactions.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => viewReport(report)}>
                              View
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => downloadReport(report, 'pdf')}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No compliance reports found.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab('overview')}>
                    Generate a Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="report-details" className="space-y-4">
          {activeReport ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="capitalize">
                      {activeReport.reportType} Compliance Report
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => downloadReport(activeReport, reportFormat)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  <CardDescription>
                    Report ID: {activeReport.id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-y-4 mb-6">
                    <div>
                      <p className="text-sm font-semibold">Generated</p>
                      <p className="text-sm">{format(new Date(activeReport.generatedAt), 'PPP')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Generated By</p>
                      <p className="text-sm">{activeReport.generatedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Period</p>
                      <p className="text-sm">
                        {format(new Date(activeReport.period.startDate), 'PPP')} to {format(new Date(activeReport.period.endDate), 'PPP')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Compliance Score</p>
                      <p className={`text-sm ${
                        activeReport.summary.complianceScore >= 90 ? 'text-green-500' : 
                        activeReport.summary.complianceScore >= 80 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {activeReport.summary.complianceScore}/100
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-secondary p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Transactions</p>
                        <p className="text-xl font-bold">{activeReport.summary.totalTransactions.toLocaleString()}</p>
                      </div>
                      <div className="bg-secondary p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Transaction Value</p>
                        <p className="text-xl font-bold">R{activeReport.summary.totalTransactionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-secondary p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">High-Value Transactions</p>
                        <p className="text-xl font-bold">{activeReport.summary.highValueTransactions}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <p className="text-muted-foreground">No report selected.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab('reports')}>
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High-Value Transactions</CardTitle>
              <CardDescription>
                Transactions exceeding regulatory threshold (R10,000) for enhanced due diligence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {highValueTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-xs">{transaction.id}</TableCell>
                      <TableCell>{transaction.username}</TableCell>
                      <TableCell>{transaction.type}</TableCell>
                      <TableCell>R{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>{format(new Date(transaction.createdAt), 'MMM d, yyyy HH:mm')}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Tools</CardTitle>
              <CardDescription>
                Export transaction records and audit trails for compliance purposes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionExport isAdmin={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
