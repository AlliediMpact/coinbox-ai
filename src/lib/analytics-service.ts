/**
 * Enhanced Analytics and Reporting Service
 * 
 * This service provides comprehensive analytics and reporting functionality
 * for both users and administrators of the CoinBox Connect platform.
 */

import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  startAfter,
  DocumentSnapshot,
  Timestamp,
  doc,
  getDoc,
  addDoc
} from 'firebase/firestore';

// For server-side use only
let adminDb: any = null;
let FieldValue: any = null;

// This will only execute on the server
if (typeof window === 'undefined') {
  try {
    const admin = require('./firebase-admin');
    const firestore = require('firebase-admin/firestore');
    adminDb = admin.adminDb;
    FieldValue = firestore.FieldValue;
  } catch (e) {
    console.error('Failed to import firebase-admin in analytics-service:', e);
  }
}

// Types for analytics data
export interface TransactionSummary {
  totalTransactions: number;
  totalVolume: number;
  successRate: number;
  averageAmount: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
}

export interface UserActivity {
  activeUsers: number;
  newUsers: number;
  retentionRate: number;
  churnRate: number;
  avgSessionTime: number;
  mostActiveHours: number[];
}

export interface DisputeMetrics {
  totalDisputes: number;
  openDisputes: number;
  resolvedDisputes: number;
  avgResolutionTime: number; // in hours
  disputeRate: number; // percentage of transactions resulting in disputes
  commonReasons: Array<{reason: string, count: number}>;
}

export interface ReferralMetrics {
  totalReferrals: number;
  activeReferrals: number;
  conversionRate: number;
  totalCommissionPaid: number;
  topReferrers: Array<{userId: string, referrals: number, commission: number}>;
}

export interface PlatformMetrics {
  transactions: TransactionSummary;
  users: UserActivity;
  disputes: DisputeMetrics;
  referrals: ReferralMetrics;
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
}

export interface ReportOptions {
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: {
    [key: string]: any;
  };
  includeFields?: string[];
  excludeFields?: string[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ExportResult {
  url: string;
  fileName: string;
  expiresAt: Date;
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  generatedAt: Date;
}

class AnalyticsService {
  /**
   * Get transaction metrics for a user or the entire platform
   */
  async getTransactionMetrics(userId?: string, period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<TransactionSummary> {
    try {
      // Get date range for the period
      const { startDate, endDate, previousStartDate, previousEndDate } = this.getDateRangeForPeriod(period);
      
      // Query transactions for current period
      const currentTransactions = await this.queryTransactions(startDate, endDate, userId);
      
      // Query transactions for previous period for comparison
      const previousTransactions = await this.queryTransactions(previousStartDate, previousEndDate, userId);
      
      // Calculate metrics
      const totalVolume = currentTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const totalTransactions = currentTransactions.length;
      const successfulTransactions = currentTransactions.filter(tx => tx.status === 'completed').length;
      const successRate = totalTransactions > 0 ? successfulTransactions / totalTransactions : 0;
      const averageAmount = totalTransactions > 0 ? totalVolume / totalTransactions : 0;
      
      // Calculate trend
      const previousVolume = previousTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const volumeChange = previousVolume > 0 ? (totalVolume - previousVolume) / previousVolume : 0;
      const trend = volumeChange > 0.05 ? 'up' : volumeChange < -0.05 ? 'down' : 'stable';
      
      return {
        totalTransactions,
        totalVolume,
        successRate,
        averageAmount,
        trend,
        percentChange: volumeChange * 100
      };
    } catch (error) {
      console.error('Failed to get transaction metrics:', error);
      // Return default values in case of error
      return {
        totalTransactions: 0,
        totalVolume: 0,
        successRate: 0,
        averageAmount: 0,
        trend: 'stable',
        percentChange: 0
      };
    }
  }
  
  /**
   * Get user activity metrics
   */
  async getUserActivityMetrics(period: 'day' | 'week' | 'month' = 'week'): Promise<UserActivity> {
    try {
      // This would typically use analytics data from a proper analytics platform
      // Here we'll use a simplified approach using login events from Firestore
      
      const { startDate, endDate, previousStartDate } = this.getDateRangeForPeriod(period);
      
      // Get active users (users who logged in during the period)
      const activeUsersQuery = query(
        collection(db, 'user_events'),
        where('type', '==', 'login'),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate)
      );
      
      const activeUserSnap = await getDocs(activeUsersQuery);
      const activeUserIds = new Set(activeUserSnap.docs.map(doc => doc.data().userId));
      
      // Get new users registered during the period
      const newUsersQuery = query(
        collection(db, 'users'),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
      
      const newUserSnap = await getDocs(newUsersQuery);
      
      // Calculate retention (users active in both current and previous period)
      const previousActiveUsersQuery = query(
        collection(db, 'user_events'),
        where('type', '==', 'login'),
        where('timestamp', '>=', previousStartDate),
        where('timestamp', '<', startDate)
      );
      
      const previousActiveSnap = await getDocs(previousActiveUsersQuery);
      const previousActiveUserIds = new Set(previousActiveSnap.docs.map(doc => doc.data().userId));
      
      // Find users who were active in both periods
      const retainedUserCount = [...previousActiveUserIds].filter(id => activeUserIds.has(id)).length;
      const retentionRate = previousActiveUserIds.size > 0 ? retainedUserCount / previousActiveUserIds.size : 0;
      
      // Get average session time from session events
      const sessionQuery = query(
        collection(db, 'user_events'),
        where('type', '==', 'session'),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate)
      );
      
      const sessionSnap = await getDocs(sessionQuery);
      const totalSessionTime = sessionSnap.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.duration || 0);
      }, 0);
      
      const avgSessionTime = sessionSnap.docs.length > 0 ? totalSessionTime / sessionSnap.docs.length : 0;
      
      // Get most active hours
      const hourCounts = new Array(24).fill(0);
      sessionSnap.docs.forEach(doc => {
        const timestamp = doc.data().timestamp?.toDate() || new Date();
        const hour = timestamp.getHours();
        hourCounts[hour]++;
      });
      
      // Find the top 3 most active hours
      const mostActiveHours = Array.from(Array(24).keys())
        .sort((a, b) => hourCounts[b] - hourCounts[a])
        .slice(0, 3);
      
      return {
        activeUsers: activeUserIds.size,
        newUsers: newUserSnap.size,
        retentionRate,
        churnRate: 1 - retentionRate,
        avgSessionTime,
        mostActiveHours
      };
    } catch (error) {
      console.error('Failed to get user activity metrics:', error);
      // Return default values in case of error
      return {
        activeUsers: 0,
        newUsers: 0,
        retentionRate: 0,
        churnRate: 0,
        avgSessionTime: 0,
        mostActiveHours: []
      };
    }
  }
  
  /**
   * Get dispute metrics
   */
  async getDisputeMetrics(period: 'week' | 'month' | 'quarter' = 'month'): Promise<DisputeMetrics> {
    try {
      const { startDate, endDate } = this.getDateRangeForPeriod(period);
      
      // Query all disputes in the period
      const disputesQuery = query(
        collection(db, 'disputes'),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
      
      const disputeSnap = await getDocs(disputesQuery);
      const disputes = disputeSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate metrics
      const totalDisputes = disputes.length;
      const openDisputes = disputes.filter(d => 
        ['Open', 'Evidence', 'UnderReview', 'Arbitration'].includes(d.status)
      ).length;
      const resolvedDisputes = disputes.filter(d => d.status === 'Resolved').length;
      
      // Calculate resolution time for resolved disputes
      let totalResolutionTimeHours = 0;
      let resolvedCount = 0;
      
      disputes.forEach(dispute => {
        if (dispute.status === 'Resolved' && dispute.createdAt && dispute.resolution?.resolvedAt) {
          const createdTime = dispute.createdAt.toDate().getTime();
          const resolvedTime = dispute.resolution.resolvedAt.toDate().getTime();
          const resolutionTimeHours = (resolvedTime - createdTime) / (1000 * 60 * 60);
          
          totalResolutionTimeHours += resolutionTimeHours;
          resolvedCount++;
        }
      });
      
      const avgResolutionTime = resolvedCount > 0 ? totalResolutionTimeHours / resolvedCount : 0;
      
      // Get total transactions in the period to calculate dispute rate
      const txQuery = query(
        collection(db, 'transactions'),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate)
      );
      
      const txSnap = await getDocs(txQuery);
      const disputeRate = txSnap.size > 0 ? totalDisputes / txSnap.size : 0;
      
      // Count common dispute reasons
      const reasonCounts: Record<string, number> = {};
      disputes.forEach(dispute => {
        const reason = dispute.reason || 'Other';
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });
      
      const commonReasons = Object.entries(reasonCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      return {
        totalDisputes,
        openDisputes,
        resolvedDisputes,
        avgResolutionTime,
        disputeRate,
        commonReasons
      };
    } catch (error) {
      console.error('Failed to get dispute metrics:', error);
      return {
        totalDisputes: 0,
        openDisputes: 0,
        resolvedDisputes: 0,
        avgResolutionTime: 0,
        disputeRate: 0,
        commonReasons: []
      };
    }
  }
  
  /**
   * Get referral metrics
   */
  async getReferralMetrics(period: 'month' | 'quarter' | 'year' = 'month'): Promise<ReferralMetrics> {
    try {
      const { startDate, endDate } = this.getDateRangeForPeriod(period);
      
      // Query referral events
      const referralsQuery = query(
        collection(db, 'referrals'),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
      
      const referralSnap = await getDocs(referralsQuery);
      const referrals = referralSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const totalReferrals = referrals.length;
      
      // Count active referrals (ones that have completed at least one transaction)
      const activeReferrals = referrals.filter(r => r.hasCompletedTransaction).length;
      const conversionRate = totalReferrals > 0 ? activeReferrals / totalReferrals : 0;
      
      // Sum commissions paid
      const totalCommissionPaid = referrals.reduce((sum, r) => sum + (r.commissionPaid || 0), 0);
      
      // Get top referrers
      const referrerMap: Record<string, { referrals: number, commission: number }> = {};
      
      referrals.forEach(ref => {
        const referrerId = ref.referrerId;
        
        if (!referrerMap[referrerId]) {
          referrerMap[referrerId] = { referrals: 0, commission: 0 };
        }
        
        referrerMap[referrerId].referrals += 1;
        referrerMap[referrerId].commission += (ref.commissionPaid || 0);
      });
      
      const topReferrers = Object.entries(referrerMap)
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.commission - a.commission)
        .slice(0, 5);
      
      return {
        totalReferrals,
        activeReferrals,
        conversionRate,
        totalCommissionPaid,
        topReferrers
      };
    } catch (error) {
      console.error('Failed to get referral metrics:', error);
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        conversionRate: 0,
        totalCommissionPaid: 0,
        topReferrers: []
      };
    }
  }
  
  /**
   * Export transactions to a specified format
   */
  async exportTransactions(options: ReportOptions): Promise<ExportResult> {
    try {
      const { format, dateRange, filters, includeFields } = options;
      
      // Create a record of this export
      const exportId = await this.recordExport('transactions', options);
      
      // Query transactions based on filters
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(dateRange.end))
      );
      
      const transactionSnap = await getDocs(transactionsQuery);
      const transactions = transactionSnap.docs.map(doc => {
        const data = doc.data();
        
        // Apply field filtering if specified
        if (includeFields && includeFields.length > 0) {
          const filteredData: Record<string, any> = { id: doc.id };
          includeFields.forEach(field => {
            if (data[field] !== undefined) {
              filteredData[field] = data[field];
            }
          });
          return filteredData;
        }
        
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Apply any additional filters
      const filteredTransactions = filters 
        ? transactions.filter(tx => this.applyFilters(tx, filters))
        : transactions;
      
      // Generate the export file
      const fileName = `transactions_export_${Date.now()}.${format}`;
      const exportUrl = await this.generateExportFile(filteredTransactions, format, fileName);
      
      // Update the export record with the URL
      await this.updateExportRecord(exportId, exportUrl);
      
      // Create expiration date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      return {
        url: exportUrl,
        fileName,
        format,
        generatedAt: new Date(),
        expiresAt
      };
    } catch (error) {
      console.error('Failed to export transactions:', error);
      throw new Error('Failed to export transactions');
    }
  }
  
  /**
   * Export user data to a specified format
   */
  async exportUsers(options: ReportOptions): Promise<ExportResult> {
    try {
      const { format, filters, includeFields } = options;
      
      // Create a record of this export
      const exportId = await this.recordExport('users', options);
      
      // Query users
      const usersQuery = query(collection(db, 'users'));
      const userSnap = await getDocs(usersQuery);
      
      const users = userSnap.docs.map(doc => {
        const data = doc.data();
        
        // Always remove sensitive fields
        const { password, authToken, ...safeData } = data;
        
        // Apply field filtering if specified
        if (includeFields && includeFields.length > 0) {
          const filteredData: Record<string, any> = { id: doc.id };
          includeFields.forEach(field => {
            if (safeData[field] !== undefined) {
              filteredData[field] = safeData[field];
            }
          });
          return filteredData;
        }
        
        return {
          id: doc.id,
          ...safeData
        };
      });
      
      // Apply any additional filters
      const filteredUsers = filters 
        ? users.filter(user => this.applyFilters(user, filters))
        : users;
      
      // Generate the export file
      const fileName = `users_export_${Date.now()}.${format}`;
      const exportUrl = await this.generateExportFile(filteredUsers, format, fileName);
      
      // Update the export record with the URL
      await this.updateExportRecord(exportId, exportUrl);
      
      // Create expiration date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      return {
        url: exportUrl,
        fileName,
        format,
        generatedAt: new Date(),
        expiresAt
      };
    } catch (error) {
      console.error('Failed to export users:', error);
      throw new Error('Failed to export users');
    }
  }
  
  /**
   * Export analytics data in various formats
   */
  async exportAnalytics(type: 'transactions' | 'users' | 'revenue', options: {
    format: 'csv' | 'json' | 'pdf' | 'excel';
    startDate?: Date;
    endDate?: Date;
    filters?: Record<string, any>;
    userId: string;
  }): Promise<string> {
    try {
      // Get data based on type
      let data: any[] = [];
      
      switch (type) {
        case 'transactions':
          const transactionResults = await this.getTransactionAnalytics({
            startDate: options.startDate,
            endDate: options.endDate,
            interval: 'daily',
            ...options.filters
          });
          data = transactionResults.data;
          break;
          
        case 'users':
          const userResults = await this.getUserGrowthMetrics({
            period: options.startDate && options.endDate ? 'custom' : 'last_30_days',
            startDate: options.startDate,
            endDate: options.endDate,
            ...options.filters
          });
          data = userResults.trend;
          break;
          
        case 'revenue':
          const revenueResults = await this.getRevenueAnalytics({
            startDate: options.startDate,
            endDate: options.endDate,
            ...options.filters
          });
          data = revenueResults.breakdown;
          break;
      }
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `coinbox-${type}-${timestamp}.${options.format === 'excel' ? 'xlsx' : options.format}`;
      
      // Create export record
      const exportId = await this.createExportRecord(options.userId, type, options);
      
      // Generate file and get URL
      const url = await this.generateExportFile(data, options.format, fileName);
      
      // Update export record with URL
      await this.updateExportRecord(exportId, url);
      
      return url;
    } catch (error) {
      console.error('Failed to export analytics:', error);
      throw new Error('Failed to export analytics');
    }
  }

  // For browser-side use
  async exportAnalyticsToFile(type: 'transactions' | 'users' | 'revenue', options: {
    format: 'csv' | 'json' | 'pdf' | 'excel';
    startDate?: Date;
    endDate?: Date;
    filters?: Record<string, any>;
  }): Promise<string> {
    try {
      // Import dynamic dependencies
      const { downloadFile } = await import('./export-utils');
      
      // Get data based on type
      let data: any[] = [];
      let fileName: string;
      
      switch (type) {
        case 'transactions':
          const transactionResults = await this.getTransactionAnalytics({
            startDate: options.startDate,
            endDate: options.endDate,
            interval: 'daily',
            ...options.filters
          });
          data = transactionResults.data;
          fileName = 'coinbox-transactions';
          break;
          
        case 'users':
          const userResults = await this.getUserGrowthMetrics({
            period: options.startDate && options.endDate ? 'custom' : 'last_30_days',
            startDate: options.startDate,
            endDate: options.endDate,
            ...options.filters
          });
          data = userResults.trend;
          fileName = 'coinbox-user-growth';
          break;
          
        case 'revenue':
          const revenueResults = await this.getRevenueAnalytics({
            startDate: options.startDate,
            endDate: options.endDate,
            ...options.filters
          });
          data = revenueResults.breakdown;
          fileName = 'coinbox-revenue';
          break;
      }
      
      // Generate file content based on format
      let content: string | Blob;
      let mimeType: string;
      
      const timestamp = new Date().toISOString().split('T')[0];
      fileName = `${fileName}-${timestamp}`;
      
      switch (options.format) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          fileName += '.json';
          break;
          
        case 'csv':
          // Simple CSV conversion
          const headers = Object.keys(data[0] || {}).join(',');
          const rows = data.map(item => Object.values(item).join(',')).join('\n');
          content = `${headers}\n${rows}`;
          mimeType = 'text/csv';
          fileName += '.csv';
          break;
          
        case 'pdf':
          // In a real implementation, you would use a PDF generation library
          content = JSON.stringify(data);
          mimeType = 'application/json';
          fileName += '.json'; // Fallback to JSON
          break;
          
        case 'excel':
          // In a real implementation, you would use an Excel generation library
          content = JSON.stringify(data);
          mimeType = 'application/json';
          fileName += '.json'; // Fallback to JSON
          break;
      }
      
      // Download the file
      return downloadFile(content, fileName, mimeType);
    } catch (error) {
      console.error('Failed to export analytics to file:', error);
      throw new Error('Failed to export analytics to file');
    }
  }
  
  /**
   * Export transactions to a specified format
   */
  async exportTransactions(options: ReportOptions): Promise<ExportResult> {
    try {
      const { format, dateRange, filters, includeFields } = options;
      
      // Create a record of this export
      const exportId = await this.recordExport('transactions', options);
      
      // Query transactions based on filters
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(dateRange.end))
      );
      
      const transactionSnap = await getDocs(transactionsQuery);
      const transactions = transactionSnap.docs.map(doc => {
        const data = doc.data();
        
        // Apply field filtering if specified
        if (includeFields && includeFields.length > 0) {
          const filteredData: Record<string, any> = { id: doc.id };
          includeFields.forEach(field => {
            if (data[field] !== undefined) {
              filteredData[field] = data[field];
            }
          });
          return filteredData;
        }
        
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Apply any additional filters
      const filteredTransactions = filters 
        ? transactions.filter(tx => this.applyFilters(tx, filters))
        : transactions;
      
      // Generate the export file
      const fileName = `transactions_export_${Date.now()}.${format}`;
      const exportUrl = await this.generateExportFile(filteredTransactions, format, fileName);
      
      // Update the export record with the url
      await this.updateExportRecord(exportId, exportUrl);
      
      // Create expiration date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      return {
        url: exportUrl,
        fileName,
        format,
        generatedAt: new Date(),
        expiresAt
      };
    } catch (error) {
      console.error('Failed to export transactions:', error);
      throw new Error('Failed to export transactions');
    }
  }
  
  /**
   * Export user data to a specified format
   */
  async exportUsers(options: ReportOptions): Promise<ExportResult> {
    try {
      const { format, filters, includeFields } = options;
      
      // Create a record of this export
      const exportId = await this.recordExport('users', options);
      
      // Query users
      const usersQuery = query(collection(db, 'users'));
      const userSnap = await getDocs(usersQuery);
      
      const users = userSnap.docs.map(doc => {
        const data = doc.data();
        
        // Always remove sensitive fields
        const { password, authToken, ...safeData } = data;
        
        // Apply field filtering if specified
        if (includeFields && includeFields.length > 0) {
          const filteredData: Record<string, any> = { id: doc.id };
          includeFields.forEach(field => {
            if (safeData[field] !== undefined) {
              filteredData[field] = safeData[field];
            }
          });
          return filteredData;
        }
        
        return {
          id: doc.id,
          ...safeData
        };
      });
      
      // Apply any additional filters
      const filteredUsers = filters 
        ? users.filter(user => this.applyFilters(user, filters))
        : users;
      
      // Generate the export file
      const fileName = `users_export_${Date.now()}.${format}`;
      const exportUrl = await this.generateExportFile(filteredUsers, format, fileName);
      
      // Update the export record with the url
      await this.updateExportRecord(exportId, exportUrl);
      
      // Create expiration date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      return {
        url: exportUrl,
        fileName,
        format,
        generatedAt: new Date(),
        expiresAt
      };
    } catch (error) {
      console.error('Failed to export users:', error);
      throw new Error('Failed to export users');
    }
  }
  
  /**
   * Get comprehensive platform metrics
   */
  async getPlatformMetrics(period: 'week' | 'month' | 'quarter' = 'month'): Promise<PlatformMetrics> {
    try {
      // Fetch all metrics in parallel for efficiency
      const [transactions, users, disputes, referrals] = await Promise.all([
        this.getTransactionMetrics(undefined, period),
        this.getUserActivityMetrics(period),
        this.getDisputeMetrics(period),
        this.getReferralMetrics(period)
      ]);
      
      // Get system health metrics
      const systemHealth = await this.getSystemHealthMetrics();
      
      return {
        transactions,
        users,
        disputes,
        referrals,
        systemHealth
      };
    } catch (error) {
      console.error('Failed to get platform metrics:', error);
      throw new Error('Failed to get platform metrics');
    }
  }
  
  /**
   * Get system health metrics
   */
  private async getSystemHealthMetrics() {
    try {
      // In a real application, this would fetch actual system metrics
      // For the demo, we'll return mock data
      const systemMetricsRef = doc(db, 'system_metrics', 'current');
      const metricsDoc = await getDoc(systemMetricsRef);
      
      if (metricsDoc.exists()) {
        const data = metricsDoc.data();
        return {
          uptime: data.uptime || 99.9,
          responseTime: data.responseTime || 250,
          errorRate: data.errorRate || 0.05
        };
      }
      
      return {
        uptime: 99.9,
        responseTime: 250,
        errorRate: 0.05
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      return {
        uptime: 99.9,
        responseTime: 250,
        errorRate: 0.05
      };
    }
  }
  
  /**
   * Query transactions with date range and optional user filter
   */
  private async queryTransactions(startDate: Date, endDate: Date, userId?: string) {
    let baseQuery = query(
      collection(db, 'transactions'),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate))
    );
    
    // Add user filter if specified
    if (userId) {
      baseQuery = query(
        baseQuery,
        where('userId', '==', userId)
      );
    }
    
    const snap = await getDocs(baseQuery);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  /**
   * Generate date ranges based on period
   */
  private getDateRangeForPeriod(period: string) {
    const endDate = new Date();
    const startDate = new Date();
    const previousEndDate = new Date();
    let previousStartDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        previousEndDate.setHours(0, 0, 0, 0);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousStartDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        previousEndDate.setDate(previousEndDate.getDate() - 7);
        previousStartDate.setDate(previousStartDate.getDate() - 14);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        previousEndDate.setMonth(previousEndDate.getMonth() - 1);
        previousStartDate.setMonth(previousStartDate.getMonth() - 2);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        previousEndDate.setMonth(previousEndDate.getMonth() - 3);
        previousStartDate.setMonth(previousStartDate.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        previousEndDate.setFullYear(previousEndDate.getFullYear() - 1);
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 2);
        break;
    }
    
    return { startDate, endDate, previousStartDate, previousEndDate };
  }
  
  /**
   * Apply filters to an object
   */
  private applyFilters(obj: Record<string, any>, filters: Record<string, any>): boolean {
    return Object.entries(filters).every(([key, value]) => {
      if (Array.isArray(value)) {
        return value.includes(obj[key]);
      }
      
      if (typeof value === 'object' && value !== null) {
        if ('min' in value && obj[key] < value.min) return false;
        if ('max' in value && obj[key] > value.max) return false;
        return true;
      }
      
      return obj[key] === value;
    });
  }
  
  /**
   * Record an export operation
   */
  private async recordExport(type: string, options: ReportOptions): Promise<string> {
    if (!adminDb) {
      console.warn('AdminDb not available, skipping export recording');
      return `mock-export-${Date.now()}`;
    }
    
    const exportRef = await adminDb.collection('exports').add({
      type,
      options,
      createdAt: FieldValue.serverTimestamp(),
      status: 'processing'
    });
    
    return exportRef.id;
  }
  
  /**
   * Update export record with URL
   */
  private async updateExportRecord(exportId: string, url: string): Promise<void> {
    if (!adminDb) {
      console.warn('AdminDb not available, skipping export record update');
      return;
    }
    
    await adminDb.collection('exports').doc(exportId).update({
      url,
      status: 'completed',
      completedAt: FieldValue.serverTimestamp()
    });
  }
  
  /**
   * Generate export file and return URL
   * This is a simplified implementation - a real version would use appropriate
   * libraries to generate the requested format and upload to cloud storage
   */
  private async generateExportFile(data: any[], format: string, fileName: string): Promise<string> {
    // In a real application, this would use libraries like xlsx, json2csv, or pdfkit
    // to generate files in the requested format, then upload them to cloud storage
    
    // For demo purposes, we'll just return a mock URL
    return `https://storage.example.com/exports/${fileName}`;
  }
}

export const analyticsService = new AnalyticsService();
