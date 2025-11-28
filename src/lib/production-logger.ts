/**
 * Production-Grade Logging Service
 * Centralizes logging with structured data, log levels, and external integration support
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  action?: string;
  resource?: string;
  duration?: number;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class ProductionLogger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Format log entry for structured logging
   */
  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        code: (error as any).code
      };
    }

    return entry;
  }

  /**
   * Send logs to external monitoring service (Datadog, Sentry, CloudWatch, etc.)
   */
  private async sendToMonitoring(entry: LogEntry): Promise<void> {
    // In production, integrate with external logging service
    // Example: Sentry, Datadog, AWS CloudWatch, etc.
    if (this.isProduction) {
      try {
        // TODO: Integrate with your monitoring service
        // Example: await sentryClient.captureMessage(entry);
        // Example: await datadogClient.log(entry);
      } catch (err) {
        // Fallback to console if external logging fails
        console.error('Failed to send log to monitoring service:', err);
      }
    }
  }

  /**
   * Write log to persistent storage for audit trail
   */
  private async persistLog(entry: LogEntry): Promise<void> {
    // For critical financial operations, persist logs
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.CRITICAL) {
      try {
        // Store in database for audit trail
        // This should be implemented with your database
        // Example: await adminDb.collection('audit_logs').add(entry);
      } catch (err) {
        console.error('Failed to persist log:', err);
      }
    }
  }

  /**
   * Core logging method
   */
  private async log(level: LogLevel, message: string, context?: LogContext, error?: Error): Promise<void> {
    const entry = this.formatLog(level, message, context, error);

    // Always output to console with proper formatting
    const consoleMethod = level === LogLevel.ERROR || level === LogLevel.CRITICAL ? console.error : console.log;
    consoleMethod(JSON.stringify(entry, null, this.isDevelopment ? 2 : 0));

    // Send to monitoring service
    await this.sendToMonitoring(entry);

    // Persist critical logs
    await this.persistLog(entry);
  }

  /**
   * Debug level logging (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Critical level logging (requires immediate attention)
   */
  critical(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.CRITICAL, message, context, error);
    
    // In production, trigger alerts for critical errors
    if (this.isProduction) {
      // TODO: Trigger PagerDuty, SMS alerts, etc.
      // Example: await alertService.sendCriticalAlert(message, error);
    }
  }

  /**
   * Log API requests for monitoring and debugging
   */
  logApiRequest(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    this.log(level, `API Request: ${method} ${path}`, {
      ...context,
      action: 'api_request',
      statusCode,
      duration,
      method,
      path
    });
  }

  /**
   * Log financial transactions (always persisted for compliance)
   */
  async logTransaction(action: string, amount: number, userId: string, context?: LogContext): Promise<void> {
    const entry = this.formatLog(LogLevel.INFO, `Transaction: ${action}`, {
      ...context,
      action: 'transaction',
      userId,
      amount,
      resource: 'financial'
    });

    // Always persist financial transactions for audit compliance
    try {
      // TODO: Store in audit-specific collection with retention policy
      // Example: await adminDb.collection('financial_audit_logs').add(entry);
    } catch (err) {
      console.error('CRITICAL: Failed to log financial transaction:', err);
    }

    // Also send through normal logging pipeline
    await this.log(LogLevel.INFO, entry.message, entry.context);
  }

  /**
   * Log security events
   */
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    const level = severity === 'critical' ? LogLevel.CRITICAL : 
                  severity === 'high' ? LogLevel.ERROR :
                  severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;

    this.log(level, `Security Event: ${event}`, {
      ...context,
      action: 'security_event',
      severity,
      resource: 'security'
    });
  }
}

// Export singleton instance
export const logger = new ProductionLogger();

// Export convenience functions
export const logError = (message: string, error?: Error, context?: LogContext) => 
  logger.error(message, error, context);

export const logInfo = (message: string, context?: LogContext) => 
  logger.info(message, context);

export const logWarn = (message: string, context?: LogContext) => 
  logger.warn(message, context);

export const logSecurityEvent = (event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext) => 
  logger.logSecurityEvent(event, severity, context);

export const logTransaction = (action: string, amount: number, userId: string, context?: LogContext) => 
  logger.logTransaction(action, amount, userId, context);
