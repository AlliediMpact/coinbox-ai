'use client';

import React, { useState, useEffect } from 'react';
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
import { AlertCircle, Download, Calendar as CalendarIcon, BarChart3 } from "lucide-react";
import { complianceReportingService } from '@/lib/compliance-reporting-service';
import { useToast } from "@/hooks/use-toast";

export default function ComplianceReporting() {
  const { user, userClaims } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'quarterly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reportFormat, setReportFormat] = useState<'json' | 'csv' | 'pdf' | 'xlsx'>('pdf');
  const [reports, setReports] = useState<any[]>([]);
  const [exportHistory, setExportHistory] = useState<any[]>([]);

  // Check if user has admin access
  const isAdmin = userClaims?.role === 'admin';

  useEffect(() => {
    if (user && isAdmin) {
      loadReportHistory();
    }
  }, [user, isAdmin]);

  const loadReportHistory = async () => {
    try {
      setLoading(true);
      
      // Mock data for reports history
      const mockReports = [
        {
          id: 'report_monthly_20250321_20250421',
          type: 'Monthly',
          format: 'PDF',
          generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          period: '03/21/2025 - 04/21/2025',
          status: 'Completed'
        },
        {
          id: 'report_quarterly_20250121_20250421',
          type: 'Quarterly',
          format: 'XLSX',
          generatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          period: '01/21/2025 - 04/21/2025',
          status: 'Completed'
        }
      ];
      
      setReports(mockReports);
      setExportHistory(mockReports);
    } catch (error) {
      console.error('Failed to load report history:', error);
      toast({
        title: "Error",
        description: "Failed to load compliance report history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      toast({
        title: "Generating Report",
        description: "Your report is being prepared. This may take a moment."
      });

      // In a real implementation, this would call the compliance service
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newReport = {
        id: `report_${reportType}_${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}`,
        type: reportType.charAt(0).toUpperCase() + reportType.slice(1),
        format: reportFormat.toUpperCase(),
        generatedAt: new Date(),
        period: `${format(startDate, 'MM/dd/yyyy')} - ${format(endDate, 'MM/dd/yyyy')}`,
        status: 'Completed'
      };
      
      setReports([newReport, ...reports]);
      setExportHistory([newReport, ...exportHistory]);
      
      toast({
        title: "Success",
        description: "Report generated successfully. You can download it now."
      });
      
      setActiveTab('history');
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        title: "Error",
        description: "Failed to generate compliance report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (report: any) => {
    toast({
      title: "Download Started",
      description: `Your ${report.type} report is being downloaded as ${report.format}`
    });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate Compliance Report</CardTitle>
              <CardDescription>
                Create reports for regulatory compliance and financial auditing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={reportType} onValueChange={(value) => setReportType(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Report</SelectItem>
                      <SelectItem value="monthly">Monthly Report</SelectItem>
                      <SelectItem value="quarterly">Quarterly Report</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Format</label>
                  <Select value={reportFormat} onValueChange={(value) => setReportFormat(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                      <SelectItem value="json">JSON Data</SelectItem>
                      <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
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
              <Button 
                onClick={generateReport} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">◌</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Report History</CardTitle>
              <CardDescription>View and download previously generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Generated Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.type}</TableCell>
                        <TableCell>{report.period}</TableCell>
                        <TableCell>{report.format}</TableCell>
                        <TableCell>{format(new Date(report.generatedAt), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => downloadReport(report)}>
                            <Download className="h-4 w-4 mr-1" /> Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No reports found. Generate a compliance report to get started.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab('generate')}>
                    Generate New Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}