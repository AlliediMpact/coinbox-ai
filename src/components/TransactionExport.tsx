'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, FileSpreadsheet, FileJson, FileText } from "lucide-react";
import { auditService } from '@/lib/audit-service';
import { useToast } from "@/components/ui/use-toast";

interface TransactionExportProps {
  userId?: string; // If provided, export only this user's transactions
  isAdmin?: boolean;
}

export default function TransactionExport({ userId, isAdmin = false }: TransactionExportProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf' | 'xlsx'>('csv');
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const handleExport = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const targetUserId = userId || user.uid;
      
      // Generate audit report based on selected format and date range
      const report = await auditService.generateAuditReport({
        format: exportFormat,
        userId: targetUserId,
        startDate,
        endDate
      });
      
      // Convert report to appropriate format and trigger download
      downloadReport(report, exportFormat, targetUserId);
      
      toast({
        title: "Export Successful",
        description: `Your transaction records have been exported as ${exportFormat.toUpperCase()}`,
      });
      
    } catch (error) {
      console.error('Failed to export transactions:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your transaction records.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const downloadReport = (data: string, format: string, userId: string) => {
    // Create blob for download
    const blob = new Blob([data], { type: getMimeType(format) });
    const url = URL.createObjectURL(blob);
    
    // Create link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction_export_${userId}_${format.toLowerCase()}_${format.toLowerCase() === 'csv' ? 
      format_date_for_filename(new Date()) : 
      format_date_for_filename(new Date())}.${format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };
  
  const getMimeType = (format: string): string => {
    switch (format.toLowerCase()) {
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      case 'pdf':
        return 'application/pdf';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'text/plain';
    }
  };
  
  const format_date_for_filename = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Export Transaction Records</CardTitle>
        <CardDescription>
          Export your transaction history for record keeping or tax purposes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Export Format</label>
          <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
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
                  onSelect={setStartDate}
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
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleExport} 
          disabled={loading || !startDate || !endDate}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin mr-2">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
                </svg>
              </div>
              Exporting...
            </div>
          ) : (
            <div className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Export {isAdmin && userId ? "User" : "My"} Transactions
            </div>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
