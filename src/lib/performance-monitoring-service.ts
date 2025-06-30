/**
 * Performance Monitoring and Optimization Service
 * Real-time performance tracking, error monitoring, and optimization suggestions
 */

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  databaseResponseTime: number;
  cacheHitRatio: number;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  type: 'client' | 'server' | 'database' | 'api';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  resolved: boolean;
}

export interface OptimizationSuggestion {
  id: string;
  category: 'performance' | 'security' | 'usability' | 'code' | 'infrastructure';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  estimatedImpact: 'minor' | 'moderate' | 'significant' | 'major';
  implementationEffort: 'low' | 'medium' | 'high';
  automated: boolean;
}

export interface RealTimeAlert {
  id: string;
  timestamp: Date;
  type: 'performance' | 'error' | 'security' | 'usage';
  severity: 'warning' | 'critical';
  message: string;
  resolved: boolean;
  autoResolve: boolean;
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetrics = {
    responseTime: 0,
    throughput: 0,
    errorRate: 0,
    uptime: 99.9,
    memoryUsage: 0,
    cpuUsage: 0,
    databaseResponseTime: 0,
    cacheHitRatio: 95
  };

  private errors: ErrorReport[] = [];
  private suggestions: OptimizationSuggestion[] = [];
  private alerts: RealTimeAlert[] = [];
  private metricsCallbacks: Array<(metrics: PerformanceMetrics) => void> = [];
  private alertCallbacks: Array<(alert: RealTimeAlert) => void> = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.initializeWebVitals();
    this.setupErrorHandling();
    this.startMetricsCollection();
    this.generateOptimizationSuggestions();

    console.log('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('Performance monitoring stopped');
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initializeWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navigationEntry = entry as PerformanceNavigationTiming;
            this.updateMetrics({
              responseTime: navigationEntry.responseEnd - navigationEntry.requestStart,
              databaseResponseTime: navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }

    // Memory usage monitoring
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.updateMetrics({
        memoryUsage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      });
    }
  }

  /**
   * Setup global error handling
   */
  private setupErrorHandling(): void {
    if (typeof window === 'undefined') return;

    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError({
        type: 'client',
        severity: 'high',
        message: event.message,
        stack: event.error?.stack,
        url: event.filename
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        type: 'client',
        severity: 'medium',
        message: `Unhandled promise rejection: ${event.reason}`,
        stack: event.reason?.stack
      });
    });
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectRealTimeMetrics();
      this.checkAlertConditions();
    }, 5000); // Collect metrics every 5 seconds
  }

  /**
   * Collect real-time metrics
   */
  private collectRealTimeMetrics(): void {
    // Simulate metrics collection
    const newMetrics: Partial<PerformanceMetrics> = {
      responseTime: Math.random() * 500 + 100, // 100-600ms
      throughput: Math.random() * 1000 + 500, // 500-1500 req/min
      errorRate: Math.random() * 5, // 0-5%
      cpuUsage: Math.random() * 80 + 10, // 10-90%
      cacheHitRatio: Math.random() * 10 + 90 // 90-100%
    };

    this.updateMetrics(newMetrics);
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(newMetrics: Partial<PerformanceMetrics>): void {
    this.metrics = { ...this.metrics, ...newMetrics };
    this.notifyMetricsCallbacks();
  }

  /**
   * Report an error
   */
  reportError(errorData: Omit<ErrorReport, 'id' | 'timestamp' | 'resolved'>): void {
    const error: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...errorData
    };

    this.errors.unshift(error);
    
    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(0, 100);
    }

    // Create alert for high severity errors
    if (error.severity === 'high' || error.severity === 'critical') {
      this.createAlert({
        type: 'error',
        severity: error.severity === 'critical' ? 'critical' : 'warning',
        message: `${error.type.toUpperCase()} Error: ${error.message}`,
        autoResolve: false
      });
    }
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(): void {
    this.suggestions = [
      {
        id: 'cache-optimization',
        category: 'performance',
        priority: 'high',
        title: 'Implement Redis Caching',
        description: 'Add Redis caching for frequently accessed data to improve response times',
        estimatedImpact: 'significant',
        implementationEffort: 'medium',
        automated: false
      },
      {
        id: 'image-optimization',
        category: 'performance',
        priority: 'medium',
        title: 'Optimize Image Loading',
        description: 'Implement lazy loading and WebP format for images',
        estimatedImpact: 'moderate',
        implementationEffort: 'low',
        automated: true
      },
      {
        id: 'database-indexing',
        category: 'performance',
        priority: 'high',
        title: 'Database Index Optimization',
        description: 'Add missing indexes on frequently queried columns',
        estimatedImpact: 'major',
        implementationEffort: 'high',
        automated: false
      },
      {
        id: 'code-splitting',
        category: 'performance',
        priority: 'medium',
        title: 'Implement Code Splitting',
        description: 'Split JavaScript bundles to reduce initial load time',
        estimatedImpact: 'significant',
        implementationEffort: 'medium',
        automated: true
      },
      {
        id: 'security-headers',
        category: 'security',
        priority: 'high',
        title: 'Security Headers Implementation',
        description: 'Add security headers like HSTS, CSP, and X-Frame-Options',
        estimatedImpact: 'moderate',
        implementationEffort: 'low',
        automated: true
      }
    ];
  }

  /**
   * Check for alert conditions
   */
  private checkAlertConditions(): void {
    // High response time alert
    if (this.metrics.responseTime > 2000) {
      this.createAlert({
        type: 'performance',
        severity: 'warning',
        message: `High response time detected: ${Math.round(this.metrics.responseTime)}ms`,
        autoResolve: true
      });
    }

    // High error rate alert
    if (this.metrics.errorRate > 5) {
      this.createAlert({
        type: 'error',
        severity: 'critical',
        message: `Error rate exceeded threshold: ${this.metrics.errorRate.toFixed(2)}%`,
        autoResolve: false
      });
    }

    // High CPU usage alert
    if (this.metrics.cpuUsage > 85) {
      this.createAlert({
        type: 'performance',
        severity: 'warning',
        message: `High CPU usage: ${Math.round(this.metrics.cpuUsage)}%`,
        autoResolve: true
      });
    }

    // Low cache hit ratio alert
    if (this.metrics.cacheHitRatio < 80) {
      this.createAlert({
        type: 'performance',
        severity: 'warning',
        message: `Low cache hit ratio: ${this.metrics.cacheHitRatio.toFixed(1)}%`,
        autoResolve: true
      });
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(alertData: Omit<RealTimeAlert, 'id' | 'timestamp' | 'resolved'>): void {
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(
      alert => !alert.resolved && alert.message === alertData.message
    );

    if (existingAlert) return;

    const alert: RealTimeAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    };

    this.alerts.unshift(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }

    this.notifyAlertCallbacks(alert);

    // Auto-resolve if specified
    if (alert.autoResolve) {
      setTimeout(() => {
        this.resolveAlert(alert.id);
      }, 30000); // Auto-resolve after 30 seconds
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get error reports
   */
  getErrors(limit = 50): ErrorReport[] {
    return this.errors.slice(0, limit);
  }

  /**
   * Get optimization suggestions
   */
  getSuggestions(): OptimizationSuggestion[] {
    return [...this.suggestions];
  }

  /**
   * Get active alerts
   */
  getAlerts(): RealTimeAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts (including resolved)
   */
  getAllAlerts(): RealTimeAlert[] {
    return [...this.alerts];
  }

  /**
   * Subscribe to metrics updates
   */
  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.metricsCallbacks.push(callback);
    return () => {
      const index = this.metricsCallbacks.indexOf(callback);
      if (index > -1) {
        this.metricsCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to alert notifications
   */
  onAlert(callback: (alert: RealTimeAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify metrics callbacks
   */
  private notifyMetricsCallbacks(): void {
    this.metricsCallbacks.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('Error in metrics callback:', error);
      }
    });
  }

  /**
   * Notify alert callbacks
   */
  private notifyAlertCallbacks(alert: RealTimeAlert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  /**
   * Export performance data
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      metrics: this.metrics,
      errors: this.errors,
      suggestions: this.suggestions,
      alerts: this.alerts,
      timestamp: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Simple CSV export for metrics
      const csvData = [
        'Metric,Value,Unit',
        `Response Time,${this.metrics.responseTime},ms`,
        `Throughput,${this.metrics.throughput},req/min`,
        `Error Rate,${this.metrics.errorRate},%`,
        `Uptime,${this.metrics.uptime},%`,
        `Memory Usage,${this.metrics.memoryUsage},%`,
        `CPU Usage,${this.metrics.cpuUsage},%`,
        `Database Response Time,${this.metrics.databaseResponseTime},ms`,
        `Cache Hit Ratio,${this.metrics.cacheHitRatio},%`
      ].join('\n');
      return csvData;
    }
  }
}

// Export singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService();
export default performanceMonitoringService;
