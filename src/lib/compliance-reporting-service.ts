/**
 * Compliance Reporting Service
 * 
 * This service provides regulatory compliance reporting capabilities for the CoinBox platform.
 * It generates comprehensive reports for financial transactions that can be used for
 * regulatory compliance, auditing, and business analytics purposes.
 */

import { 
  getFirestore,
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  DocumentData,
  Timestamp,
  startAfter,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { Transaction } from './transaction-service';
import { TradeTicket } from './types';
import { auditService, AuditOperation } from './audit-service';
import { format } from 'date-fns';

// Types for compliance reporting
export interface ComplianceReport {
  id: string;
  reportType: 'daily' | 'monthly' | 'quarterly' | 'custom';
  generatedAt: Date;
  generatedBy: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: ReportSummary;
  sections: ReportSection[];
  metadata?: Record<string, any>;
}

export interface ReportSummary {
  totalTransactions: number;
  totalTransactionValue: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  highValueTransactions: number;
  flaggedTransactions: number;
  uniqueUsers: number;
  complianceScore?: number;
}

export interface ReportSection {
  title: string;
  description: string;
  data: any[];
  charts?: any[];
}

export interface ReportOptions {
  reportType: ComplianceReport['reportType'];
  startDate?: Date;
  endDate?: Date;
  includeUserDetails?: boolean;
  includeHighRiskOnly?: boolean;
  format?: 'json' | 'csv' | 'pdf' | 'xlsx';
  userId?: string;
  transactionTypes?: string[];
}

class ComplianceReportingService {
  /**
   * Generate a compliance report based on specified options
   */
  async generateReport(options: ReportOptions, adminId: string): Promise<ComplianceReport> {
    try {
      // Determine date range if not explicitly provided
      const { startDate, endDate } = this.getDateRangeForReportType(options);
      
      // Generate report ID
      const reportId = `report_${options.reportType}_${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}_${Date.now()}`;
      
      // Get transactions within the date range
      const transactions = await this.getTransactionsForReport(startDate, endDate, options);
      
      // Get trade tickets within the date range
      const trades = await this.getTradesForReport(startDate, endDate, options);
      
      // Process data and generate summary
      const summary = this.generateReportSummary(transactions, trades);
      
      // Create sections for the report
      const sections = await this.generateReportSections(transactions, trades, options);
      
      // Create the report object
      const report: ComplianceReport = {
        id: reportId,
        reportType: options.reportType,
        generatedAt: new Date(),
        generatedBy: adminId,
        period: {
          startDate,
          endDate
        },
        summary,
        sections,
        metadata: {
          reportOptions: options
        }
      };
      
      // Log report generation in audit trail
      await auditService.createAuditRecord({
        operation: 'report_generated' as AuditOperation,
        resourceType: 'transaction',
        resourceId: reportId,
        userId: 'system',
        performedBy: adminId,
        isSystemAction: false,
        details: {
          action: `Generated ${options.reportType} compliance report`,
          reason: 'Regulatory compliance'
        },
        metadata: {
          reportPeriod: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        }
      });
      
      return report;
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw error;
    }
  }
  
  /**
   * Get transactions for the report based on date range and filters
   */
  private async getTransactionsForReport(
    startDate: Date, 
    endDate: Date, 
    options: ReportOptions
  ): Promise<Transaction[]> {
    const transactionCollection = collection(db, 'transactions');
    
    // Build query based on date range
    let transactionQuery = query(
      transactionCollection,
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'asc'),
      limit(1000) // Reasonable limit for report processing
    );
    
    // Add user filter if requested
    if (options.userId) {
      transactionQuery = query(
        transactionQuery,
        where('userId', '==', options.userId)
      );
    }
    
    // Add transaction type filter if requested
    if (options.transactionTypes && options.transactionTypes.length > 0) {
      transactionQuery = query(
        transactionQuery,
        where('type', 'in', options.transactionTypes)
      );
    }
    
    const querySnapshot = await getDocs(transactionQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Transaction));
  }
  
  /**
   * Get trade tickets for the report based on date range and filters
   */
  private async getTradesForReport(
    startDate: Date, 
    endDate: Date, 
    options: ReportOptions
  ): Promise<TradeTicket[]> {
    const tradesCollection = collection(db, 'tickets');
    
    // Build query based on date range
    let tradesQuery = query(
      tradesCollection,
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'asc'),
      limit(1000) // Reasonable limit for report processing
    );
    
    // Add user filter if requested
    if (options.userId) {
      tradesQuery = query(
        tradesQuery,
        where('userId', '==', options.userId)
      );
    }
    
    const querySnapshot = await getDocs(tradesQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TradeTicket));
  }
  
  /**
   * Generate summary statistics for the report
   */
  private generateReportSummary(transactions: Transaction[], trades: TradeTicket[]): ReportSummary {
    // Count total transactions
    const totalTransactions = transactions.length;
    
    // Sum the total value of all transactions
    const totalTransactionValue = transactions.reduce(
      (sum, transaction) => sum + Math.abs(transaction.amount || 0), 
      0
    );
    
    // Count transactions by status
    const successfulTransactions = transactions.filter(
      t => t.status === 'completed'
    ).length;
    
    const failedTransactions = transactions.filter(
      t => t.status === 'failed'
    ).length;
    
    const pendingTransactions = transactions.filter(
      t => t.status === 'pending' || t.status === 'processing'
    ).length;
    
    // Count high value transactions (> R10,000)
    const highValueTransactions = transactions.filter(
      t => Math.abs(t.amount || 0) > 10000
    ).length;
    
    // Get unique users involved in transactions
    const userIds = new Set<string>();
    transactions.forEach(t => userIds.add(t.userId));
    
    // Calculate compliance score (example algorithm - would be more complex in reality)
    // Higher score is better, scale 0-100
    const complianceScore = Math.min(
      100,
      Math.max(
        0,
        100 - (failedTransactions * 5) - (pendingTransactions * 2) - (highValueTransactions * 1)
      )
    );
    
    // Return summary object
    return {
      totalTransactions,
      totalTransactionValue,
      successfulTransactions,
      failedTransactions,
      pendingTransactions,
      highValueTransactions,
      flaggedTransactions: 0, // Would need integration with fraud detection
      uniqueUsers: userIds.size,
      complianceScore
    };
  }
  
  /**
   * Generate detailed sections for the report
   */
  private async generateReportSections(
    transactions: Transaction[], 
    trades: TradeTicket[],
    options: ReportOptions
  ): Promise<ReportSection[]> {
    const sections: ReportSection[] = [];
    
    // Transaction Summary Section
    sections.push({
      title: 'Transaction Summary',
      description: 'Overview of all financial transactions in the reporting period',
      data: this.prepareTransactionSummaryData(transactions)
    });
    
    // High Value Transactions Section
    const highValueTransactions = transactions.filter(t => Math.abs(t.amount || 0) > 10000);
    if (highValueTransactions.length > 0) {
      sections.push({
        title: 'High Value Transactions',
        description: 'Details of all transactions exceeding R10,000',
        data: this.prepareHighValueTransactionData(highValueTransactions, options.includeUserDetails)
      });
    }
    
    // Trade Activity Section
    if (trades.length > 0) {
      sections.push({
        title: 'Trading Activity',
        description: 'Summary of peer-to-peer trading activity',
        data: this.prepareTradeActivityData(trades)
      });
    }
    
    // Add additional sections for custom report types
    if (options.reportType === 'monthly' || options.reportType === 'quarterly') {
      sections.push({
        title: 'Regulatory Compliance Summary',
        description: 'Overview of compliance metrics and key regulatory indicators',
        data: this.prepareComplianceData(transactions, trades)
      });
    }
    
    return sections;
  }
  
  /**
   * Prepare transaction summary data for reporting
   */
  private prepareTransactionSummaryData(transactions: Transaction[]): any[] {
    // Group transactions by type
    const transactionsByType: Record<string, any> = {};
    
    transactions.forEach(transaction => {
      const type = transaction.type || 'unknown';
      
      if (!transactionsByType[type]) {
        transactionsByType[type] = {
          type,
          count: 0,
          totalValue: 0,
          successful: 0,
          failed: 0,
          pending: 0
        };
      }
      
      transactionsByType[type].count++;
      transactionsByType[type].totalValue += Math.abs(transaction.amount || 0);
      
      if (transaction.status === 'completed') {
        transactionsByType[type].successful++;
      } else if (transaction.status === 'failed') {
        transactionsByType[type].failed++;
      } else {
        transactionsByType[type].pending++;
      }
    });
    
    return Object.values(transactionsByType);
  }
  
  /**
   * Prepare high value transaction data for reporting
   */
  private prepareHighValueTransactionData(
    transactions: Transaction[], 
    includeUserDetails: boolean = false
  ): any[] {
    return transactions.map(transaction => {
      const data: any = {
        id: transaction.id,
        date: transaction.createdAt instanceof Date 
          ? transaction.createdAt.toISOString() 
          : new Date((transaction.createdAt as any).seconds * 1000).toISOString(),
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        reference: transaction.reference || 'N/A'
      };
      
      // Add user details if requested and allowed by privacy settings
      if (includeUserDetails) {
        data.userId = transaction.userId;
        // In a real implementation, we might fetch more user details here
      }
      
      return data;
    });
  }
  
  /**
   * Prepare trade activity data for reporting
   */
  private prepareTradeActivityData(trades: TradeTicket[]): any[] {
    // Group trades by status
    const tradesByStatus: Record<string, number> = {};
    const tradeValueByStatus: Record<string, number> = {};
    
    trades.forEach(trade => {
      const status = trade.status || 'Unknown';
      
      if (!tradesByStatus[status]) {
        tradesByStatus[status] = 0;
        tradeValueByStatus[status] = 0;
      }
      
      tradesByStatus[status]++;
      tradeValueByStatus[status] += trade.amount || 0;
    });
    
    // Convert to array for reporting
    return Object.keys(tradesByStatus).map(status => ({
      status,
      count: tradesByStatus[status],
      totalValue: tradeValueByStatus[status]
    }));
  }
  
  /**
   * Prepare compliance data for regulatory reporting
   */
  private prepareComplianceData(transactions: Transaction[], trades: TradeTicket[]): any[] {
    // This would be expanded based on actual regulatory requirements
    const highValueCount = transactions.filter(t => Math.abs(t.amount || 0) > 10000).length;
    const completedTradeCount = trades.filter(t => t.status === 'Completed').length;
    const disputedTradeCount = trades.filter(t => t.status === 'Disputed').length;
    
    return [
      {
        metricName: 'High Value Transaction Percentage',
        value: ((highValueCount / transactions.length) * 100).toFixed(2) + '%',
        threshold: '5%',
        compliant: (highValueCount / transactions.length) < 0.05
      },
      {
        metricName: 'Successful Trade Completion Rate',
        value: ((completedTradeCount / trades.length) * 100).toFixed(2) + '%',
        threshold: '90%',
        compliant: (completedTradeCount / trades.length) > 0.9
      },
      {
        metricName: 'Dispute Rate',
        value: ((disputedTradeCount / trades.length) * 100).toFixed(2) + '%',
        threshold: '2%',
        compliant: (disputedTradeCount / trades.length) < 0.02
      }
    ];
  }
  
  /**
   * Determine appropriate date range based on report type
   */
  private getDateRangeForReportType(options: ReportOptions): { startDate: Date, endDate: Date } {
    const now = new Date();
    
    // If explicit dates provided, use those
    if (options.startDate && options.endDate) {
      return {
        startDate: options.startDate,
        endDate: options.endDate
      };
    }
    
    let startDate = new Date();
    let endDate = new Date();
    
    switch (options.reportType) {
      case 'daily':
        // Last 24 hours
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
        
      case 'monthly':
        // Last 30 days
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
        
      case 'quarterly':
        // Last 90 days
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
        
      default:
        // Default to last 30 days for custom reports
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }
    
    return { startDate, endDate };
  }
  
  /**
   * Format and export the report in the requested format
   */
  async exportReport(report: ComplianceReport, format: ReportOptions['format'] = 'json'): Promise<string> {
    try {
      switch (format) {
        case 'csv':
          return this.exportReportAsCsv(report);
        case 'json':
          return JSON.stringify(report, null, 2);
        case 'pdf':
          return this.exportReportAsPdf(report);
        case 'xlsx':
          return this.exportReportAsXlsx(report);
        default:
          return JSON.stringify(report, null, 2);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
      throw error;
    }
  }
  
  /**
   * Export report in CSV format
   */
  private exportReportAsCsv(report: ComplianceReport): string {
    let csv = '';
    
    // Add report metadata
    csv += `Report ID,${report.id}\n`;
    csv += `Report Type,${report.reportType}\n`;
    csv += `Generated At,${report.generatedAt.toISOString()}\n`;
    csv += `Period,${report.period.startDate.toISOString()} to ${report.period.endDate.toISOString()}\n\n`;
    
    // Add summary section
    csv += 'SUMMARY\n';
    for (const [key, value] of Object.entries(report.summary)) {
      csv += `${this.formatCsvHeader(key)},${value}\n`;
    }
    csv += '\n';
    
    // Add each section
    for (const section of report.sections) {
      csv += `${section.title.toUpperCase()}\n`;
      csv += `${section.description}\n`;
      
      // Add header row if data exists
      if (section.data.length > 0) {
        // Get headers from first data object
        const headers = Object.keys(section.data[0]);
        csv += headers.map(h => this.formatCsvHeader(h)).join(',') + '\n';
        
        // Add data rows
        section.data.forEach(row => {
          csv += headers.map(key => this.escapeCsvValue(row[key])).join(',') + '\n';
        });
      }
      
      csv += '\n';
    }
    
    return csv;
  }
  
  /**
   * Format header for CSV by converting camelCase to Title Case
   */
  private formatCsvHeader(header: string): string {
    return header
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  }
  
  /**
   * Escape values for CSV format
   */
  private escapeCsvValue(value: any): string {
    if (value === undefined || value === null) return '';
    
    // Convert to string and handle special CSV characters
    const stringValue = String(value);
    
    // If contains comma, quote, or newline, wrap in quotes
    if (/[",\n\r]/.test(stringValue)) {
      // Escape quotes by doubling them
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }
  
  /**
   * Export report in PDF format
   * NOTE: Placeholder for actual PDF generation
   */
  private exportReportAsPdf(report: ComplianceReport): string {
    // In a real implementation, we would use a PDF library
    // For now, return JSON as a placeholder
    return JSON.stringify(report, null, 2);
  }
  
  /**
   * Export report in XLSX format
   * NOTE: Placeholder for actual Excel generation
   */
  private exportReportAsXlsx(report: ComplianceReport): string {
    // In a real implementation, we would use an Excel library
    // For now, return JSON as a placeholder
    return JSON.stringify(report, null, 2);
  }
}

export const complianceReportingService = new ComplianceReportingService();
