/**
 * Audit Service
 * 
 * This service provides comprehensive audit trail functionality for all financial transactions
 * in the CoinBox platform. It automatically logs all financial activities with detailed
 * metadata and provides exportable audit reports for regulatory compliance.
 */

import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  DocumentData,
  addDoc,
  Timestamp,
  DocumentReference,
  startAfter,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { adminDb } from './firebase-admin';

// Types for audit records
export interface AuditRecord {
  id?: string;
  operation: AuditOperation;
  resourceType: 'transaction' | 'wallet' | 'trade' | 'escrow' | 'commission' | 'user';
  resourceId: string;
  userId: string;
  performedBy: string; // userId of the actor, can be same as userId or an admin
  timestamp: Date | Timestamp;
  details: {
    action: string;
    amount?: number;
    before?: any;
    after?: any;
    reason?: string;
    location?: string;
    ipAddress?: string;
  };
  metadata?: Record<string, any>;
  isSystemAction: boolean;
}

export type AuditOperation = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view' 
  | 'export'
  | 'transaction_initiated'
  | 'transaction_completed'
  | 'transaction_failed'
  | 'trade_matched'
  | 'escrow_created'
  | 'escrow_released'
  | 'dispute_raised'
  | 'access_granted'
  | 'access_revoked'
  | 'report_generated';

export interface AuditQueryOptions {
  userId?: string;
  resourceType?: AuditRecord['resourceType'];
  resourceId?: string;
  operation?: AuditOperation;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  startAfterRecord?: AuditRecord;
}

export interface AuditExportOptions {
  format: 'csv' | 'json' | 'pdf';
  startDate?: Date;
  endDate?: Date;
  resourceType?: AuditRecord['resourceType'];
  userId?: string;
}

class AuditService {
  /**
   * Create an audit record for any financial or security action
   */
  async createAuditRecord(record: Omit<AuditRecord, 'id' | 'timestamp'>): Promise<string> {
    try {
      const auditCollection = collection(db, 'auditTrail');
      
      // Add timestamp if not provided
      const recordWithTimestamp = {
        ...record,
        timestamp: serverTimestamp()
      };
      
      const docRef = await addDoc(auditCollection, recordWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('Failed to create audit record:', error);
      // Still throw the error so caller can handle it if needed
      throw error;
    }
  }

  /**
   * Log a financial transaction in the audit trail
   */
  async logFinancialTransaction(
    operation: 'transaction_initiated' | 'transaction_completed' | 'transaction_failed',
    transactionId: string,
    userId: string,
    details: {
      amount: number;
      type: string;
      before?: number;
      after?: number;
      reason?: string;
    },
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.createAuditRecord({
      operation,
      resourceType: 'transaction',
      resourceId: transactionId,
      userId,
      performedBy: userId, // Assumes user performed their own transaction
      isSystemAction: false,
      details: {
        action: `Financial transaction ${operation}`,
        amount: details.amount,
        before: details.before,
        after: details.after,
        reason: details.reason
      },
      metadata
    });
  }
  
  /**
   * Log system actions like automated processes
   */
  async logSystemAction(
    operation: AuditOperation,
    resourceType: AuditRecord['resourceType'],
    resourceId: string,
    userId: string,
    details: {
      action: string;
      [key: string]: any;
    }
  ): Promise<string> {
    return this.createAuditRecord({
      operation,
      resourceType,
      resourceId,
      userId,
      performedBy: 'system',
      isSystemAction: true,
      details
    });
  }
  
  /**
   * Log administrative actions for compliance reporting
   */
  async logAdminAction(
    operation: AuditOperation,
    resourceType: AuditRecord['resourceType'],
    resourceId: string,
    userId: string,
    adminId: string,
    details: {
      action: string;
      reason: string;
      [key: string]: any;
    }
  ): Promise<string> {
    return this.createAuditRecord({
      operation,
      resourceType,
      resourceId,
      userId,
      performedBy: adminId,
      isSystemAction: false,
      details,
      metadata: {
        adminAction: true
      }
    });
  }
  
  /**
   * Get audit records based on query parameters
   */
  async getAuditRecords(options: AuditQueryOptions = {}): Promise<AuditRecord[]> {
    try {
      const auditCollection = collection(db, 'auditTrail');
      
      // Build query based on provided options
      let auditQuery = query(auditCollection, orderBy('timestamp', 'desc'));
      
      if (options.userId) {
        auditQuery = query(auditQuery, where('userId', '==', options.userId));
      }
      
      if (options.resourceType) {
        auditQuery = query(auditQuery, where('resourceType', '==', options.resourceType));
      }
      
      if (options.resourceId) {
        auditQuery = query(auditQuery, where('resourceId', '==', options.resourceId));
      }
      
      if (options.operation) {
        auditQuery = query(auditQuery, where('operation', '==', options.operation));
      }
      
      if (options.startDate) {
        auditQuery = query(auditQuery, where('timestamp', '>=', Timestamp.fromDate(options.startDate)));
      }
      
      if (options.endDate) {
        auditQuery = query(auditQuery, where('timestamp', '<=', Timestamp.fromDate(options.endDate)));
      }
      
      if (options.startAfterRecord && options.startAfterRecord.timestamp) {
        auditQuery = query(
          auditQuery, 
          startAfter(options.startAfterRecord.timestamp)
        );
      }
      
      if (options.limit) {
        auditQuery = query(auditQuery, limit(options.limit));
      }
      
      const querySnapshot = await getDocs(auditQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AuditRecord));
    } catch (error) {
      console.error('Failed to get audit records:', error);
      throw error;
    }
  }
  
  /**
   * Generate an exportable audit report for compliance purposes
   */
  async generateAuditReport(options: AuditExportOptions): Promise<string> {
    try {
      // First log the report generation itself as an audit event
      await this.createAuditRecord({
        operation: 'report_generated',
        resourceType: 'transaction',
        resourceId: 'audit_report',
        userId: 'system',
        performedBy: options.userId || 'system',
        isSystemAction: true,
        details: {
          action: `Generated ${options.format} audit report`,
          reason: 'Compliance reporting'
        },
        metadata: {
          reportOptions: options
        }
      });
      
      // Get the records for the report
      const records = await this.getAuditRecords({
        userId: options.userId,
        resourceType: options.resourceType,
        startDate: options.startDate,
        endDate: options.endDate,
        limit: 1000 // Reasonable limit for reports
      });
      
      // Process based on requested format
      switch(options.format) {
        case 'csv':
          return this.generateCsvReport(records);
        case 'json':
          return this.generateJsonReport(records);
        case 'pdf':
          return this.generatePdfReport(records);
        default:
          throw new Error(`Unsupported report format: ${options.format}`);
      }
    } catch (error) {
      console.error('Failed to generate audit report:', error);
      throw error;
    }
  }
  
  /**
   * Generate CSV format report
   */
  private generateCsvReport(records: AuditRecord[]): string {
    // CSV header
    let csv = 'Timestamp,Operation,ResourceType,ResourceID,UserID,PerformedBy,Action,Amount,Details\n';
    
    // Add each record as a CSV row
    records.forEach(record => {
      const timestamp = record.timestamp instanceof Date 
        ? record.timestamp.toISOString() 
        : new Date((record.timestamp as any).seconds * 1000).toISOString();
      
      const amount = record.details.amount !== undefined ? record.details.amount : '';
      
      // Clean and escape fields for CSV
      const details = JSON.stringify(record.details)
        .replace(/"/g, '""') // Escape quotes
        .replace(/,/g, ';'); // Replace commas with semicolons to avoid CSV issues
      
      csv += `"${timestamp}","${record.operation}","${record.resourceType}","${record.resourceId}","${record.userId}","${record.performedBy}","${record.details.action}","${amount}","${details}"\n`;
    });
    
    return csv;
  }
  
  /**
   * Generate JSON format report
   */
  private generateJsonReport(records: AuditRecord[]): string {
    // Transform Timestamp objects to ISO strings for JSON serialization
    const processedRecords = records.map(record => ({
      ...record,
      timestamp: record.timestamp instanceof Date 
        ? record.timestamp.toISOString() 
        : new Date((record.timestamp as any).seconds * 1000).toISOString()
    }));
    
    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      recordCount: records.length,
      records: processedRecords
    }, null, 2);
  }
  
  /**
   * Generate PDF format report
   * NOTE: This is a placeholder - would need to integrate with a PDF generation library
   */
  private generatePdfReport(records: AuditRecord[]): string {
    // In a real implementation, this would use a PDF library
    // For now, return JSON as a placeholder
    return this.generateJsonReport(records);
  }
}

export const auditService = new AuditService();
