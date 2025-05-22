/**
 * System Monitoring Service
 * 
 * This service provides comprehensive system monitoring, error logging, 
 * and alerting functionality for the CoinBox platform.
 */

import { db } from './firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  where,
  limit,
  Timestamp
} from './mocked-firebase';

// Types for monitoring
export interface SystemLog {
  id?: string;
  timestamp: Date | Timestamp;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  component: string;
  message: string;
  details?: any;
  userId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export interface MonitoringAlert {
  id?: string;
  timestamp: Date | Timestamp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  component: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  resolvedBy?: string;
  resolvedAt?: Date | Timestamp;
  metadata?: Record<string, any>;
}

export interface SystemHealthStatus {
  status: 'operational' | 'degraded' | 'outage';
  components: {
    [key: string]: {
      status: 'operational' | 'degraded' | 'outage';
      lastChecked: Date;
      metrics?: {
        responseTime?: number;
        errorRate?: number;
        uptime?: number;
      };
    };
  };
  lastUpdated: Date;
}

export interface BackupMetadata {
  id: string;
  timestamp: Date | Timestamp;
  type: 'full' | 'incremental';
  status: 'in_progress' | 'completed' | 'failed';
  location: string;
  sizeInBytes: number;
  durationMs?: number;
  initiatedBy: string;
  components: string[];
}

class SystemMonitoringService {
  private logBuffer: SystemLog[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly MAX_BUFFER_SIZE = 50;
  private readonly FLUSH_INTERVAL_MS = 10000; // 10 seconds

  constructor() {
    if (typeof window !== 'undefined') {
      // Only in browser environment
      this.flushInterval = setInterval(() => this.flushLogs(), this.FLUSH_INTERVAL_MS);
      
      // Listen for unhandled errors
      window.addEventListener('error', this.handleGlobalError);
      window.addEventListener('unhandledrejection', this.handlePromiseRejection);
    }
  }

  /**
   * Initialize the monitoring service
   */
  initialize() {
    // Check system health on startup
    this.checkSystemHealth();
    
    // In a real system, we'd start scheduled health checks here
    console.info('System monitoring service initialized');
  }
  
  /**
   * Handle global errors
   */
  private handleGlobalError = (event: ErrorEvent) => {
    this.logError('global', event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  };
  
  /**
   * Handle unhandled promise rejections
   */
  private handlePromiseRejection = (event: PromiseRejectionEvent) => {
    const message = typeof event.reason === 'string' ? 
      event.reason : 
      'Unhandled promise rejection';
    
    this.logError('promise', message, {
      reason: event.reason
    });
  };

  /**
   * Log a debug message
   */
  logDebug(component: string, message: string, details?: any, userId?: string) {
    this.addToLogBuffer({
      timestamp: new Date(),
      level: 'debug',
      component,
      message,
      details,
      userId
    });
  }
  
  /**
   * Log an informational message
   */
  logInfo(component: string, message: string, details?: any, userId?: string) {
    this.addToLogBuffer({
      timestamp: new Date(),
      level: 'info',
      component,
      message,
      details,
      userId
    });
  }
  
  /**
   * Log a warning message
   */
  logWarning(component: string, message: string, details?: any, userId?: string) {
    this.addToLogBuffer({
      timestamp: new Date(),
      level: 'warn',
      component,
      message,
      details,
      userId
    });
  }
  
  /**
   * Log an error message
   */
  logError(component: string, message: string, details?: any, userId?: string) {
    this.addToLogBuffer({
      timestamp: new Date(),
      level: 'error',
      component,
      message,
      details,
      userId
    });
    
    // For errors, also check if we should trigger an alert
    this.evaluateAndTriggerAlert(component, message, details);
  }
  
  /**
   * Log a critical error
   */
  logCritical(component: string, message: string, details?: any, userId?: string) {
    const log: SystemLog = {
      timestamp: new Date(),
      level: 'critical',
      component,
      message,
      details,
      userId
    };
    
    // Critical logs bypass the buffer and are written immediately
    this.writeLogToDatabase(log);
    
    // Also trigger an alert for critical issues
    this.createAlert({
      timestamp: new Date(),
      severity: 'critical',
      title: `CRITICAL: ${component}`,
      message,
      component,
      status: 'active',
      metadata: { details }
    });
  }
  
  /**
   * Add a log to the buffer
   */
  private addToLogBuffer(log: SystemLog) {
    this.logBuffer.push(log);
    
    // If buffer is full, flush it
    if (this.logBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.flushLogs();
    }
    
    // Also output to console (for development)
    this.outputToConsole(log);
  }
  
  /**
   * Output log to console
   */
  private outputToConsole(log: SystemLog) {
    const { level, component, message, details } = log;
    
    switch (level) {
      case 'debug':
        console.debug(`[${component}] ${message}`, details || '');
        break;
      case 'info':
        console.info(`[${component}] ${message}`, details || '');
        break;
      case 'warn':
        console.warn(`[${component}] ${message}`, details || '');
        break;
      case 'error':
      case 'critical':
        console.error(`[${component}] ${message}`, details || '');
        break;
    }
  }
  
  /**
   * Flush logs to database
   */
  async flushLogs() {
    if (this.logBuffer.length === 0) return;
    
    const logs = [...this.logBuffer];
    this.logBuffer = [];
    
    try {
      // Batch write logs to database
      const logsCollection = collection(db, 'systemLogs');
      
      // In a real implementation, we'd use batch writes
      for (const log of logs) {
        await this.writeLogToDatabase(log);
      }
    } catch (error) {
      console.error('Failed to flush logs:', error);
      
      // Put the logs back in the buffer to try again
      this.logBuffer = [...logs, ...this.logBuffer];
    }
  }
  
  /**
   * Write a single log to the database
   */
  private async writeLogToDatabase(log: SystemLog) {
    try {
      const logsCollection = collection(db, 'systemLogs');
      await addDoc(logsCollection, {
        ...log,
        timestamp: log.timestamp // In real Firebase, would be Timestamp.fromDate(log.timestamp)
      });
    } catch (error) {
      console.error('Failed to write log to database:', error);
    }
  }
  
  /**
   * Evaluate if an alert should be triggered
   */
  private evaluateAndTriggerAlert(component: string, message: string, details?: any) {
    // In a real implementation, this would have more sophisticated logic
    // For now, we'll create an alert for any error in critical components
    
    const criticalComponents = [
      'authentication', 
      'payment', 
      'transaction', 
      'escrow', 
      'database'
    ];
    
    if (criticalComponents.includes(component.toLowerCase())) {
      this.createAlert({
        timestamp: new Date(),
        severity: 'high',
        title: `Error in ${component}`,
        message,
        component,
        status: 'active',
        metadata: { details }
      });
    }
  }
  
  /**
   * Create a new alert
   */
  async createAlert(alert: Omit<MonitoringAlert, 'id'>) {
    try {
      const alertsCollection = collection(db, 'systemAlerts');
      await addDoc(alertsCollection, {
        ...alert,
        timestamp: alert.timestamp // In real Firebase, would be Timestamp.fromDate(alert.timestamp)
      });
      
      // In a real implementation, this would also trigger notifications
      // to appropriate personnel based on severity
      console.warn(`ALERT [${alert.severity}]: ${alert.title} - ${alert.message}`);
      
      return true;
    } catch (error) {
      console.error('Failed to create alert:', error);
      return false;
    }
  }
  
  /**
   * Update an alert status
   */
  async updateAlertStatus(
    alertId: string, 
    status: MonitoringAlert['status'], 
    userId: string
  ) {
    try {
      // In a real implementation, this would update the alert in Firestore
      console.info(`Alert ${alertId} updated to ${status} by ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to update alert status:', error);
      return false;
    }
  }
  
  /**
   * Get active alerts
   */
  async getActiveAlerts() {
    try {
      // In a real implementation, this would query Firestore
      return []; // Mock empty result
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      return [];
    }
  }
  
  /**
   * Check system health
   */
  async checkSystemHealth(): Promise<SystemHealthStatus> {
    // In a real implementation, this would actually check various system components
    
    const healthStatus: SystemHealthStatus = {
      status: 'operational',
      components: {
        database: {
          status: 'operational',
          lastChecked: new Date(),
          metrics: {
            responseTime: 45, // ms
            errorRate: 0,
            uptime: 100
          }
        },
        authentication: {
          status: 'operational',
          lastChecked: new Date(),
          metrics: {
            responseTime: 120, // ms
            errorRate: 0,
            uptime: 99.9
          }
        },
        paymentProcessor: {
          status: 'operational',
          lastChecked: new Date(),
          metrics: {
            responseTime: 250, // ms
            errorRate: 0.1,
            uptime: 99.8
          }
        },
        tradingEngine: {
          status: 'operational',
          lastChecked: new Date(),
          metrics: {
            responseTime: 80, // ms
            errorRate: 0,
            uptime: 99.95
          }
        }
      },
      lastUpdated: new Date()
    };
    
    return healthStatus;
  }
  
  /**
   * Create a backup
   */
  async createBackup(
    type: BackupMetadata['type'] = 'full',
    components: string[] = ['database', 'storage', 'auth']
  ): Promise<BackupMetadata | null> {
    try {
      // In a real implementation, this would initiate a backup process
      
      const backupMeta: BackupMetadata = {
        id: `backup_${Date.now()}`,
        timestamp: new Date(),
        type,
        status: 'in_progress',
        location: 'gs://coinbox-backup/2025-05-21/',
        sizeInBytes: 0, // Unknown until completed
        initiatedBy: 'system',
        components
      };
      
      // Log the backup initiation
      this.logInfo('backup', `Started ${type} backup`, { backupId: backupMeta.id });
      
      return backupMeta;
    } catch (error) {
      this.logError('backup', 'Failed to create backup', { error });
      return null;
    }
  }
  
  /**
   * Clean up resources when service is destroyed
   */
  cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.handleGlobalError);
      window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
    }
    
    // Flush any remaining logs
    this.flushLogs();
  }
}

export const systemMonitoring = new SystemMonitoringService();
