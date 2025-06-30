import { describe, test, expect, vi, beforeEach } from 'vitest';
import performanceMonitoringService, { 
  PerformanceMetrics, 
  ErrorReport, 
  OptimizationSuggestion, 
  RealTimeAlert 
} from '../lib/performance-monitoring-service';

describe('Performance Monitoring Service', () => {
  beforeEach(() => {
    // Reset service state before each test
    performanceMonitoringService.stopMonitoring();
  });

  test('should initialize with default metrics', () => {
    const metrics = performanceMonitoringService.getMetrics();
    
    expect(metrics).toBeDefined();
    expect(metrics.responseTime).toBe(0);
    expect(metrics.throughput).toBe(0);
    expect(metrics.errorRate).toBe(0);
    expect(metrics.uptime).toBe(99.9);
    expect(metrics.cacheHitRatio).toBe(95);
  });

  test('should start and stop monitoring', () => {
    // Test starting monitoring
    performanceMonitoringService.startMonitoring();
    
    // Should have optimization suggestions
    const suggestions = performanceMonitoringService.getSuggestions();
    expect(suggestions.length).toBeGreaterThan(0);
    
    // Test stopping monitoring
    performanceMonitoringService.stopMonitoring();
  });

  test('should report errors correctly', () => {
    performanceMonitoringService.reportError({
      type: 'client',
      severity: 'high',
      message: 'Test error',
      stack: 'Error stack trace'
    });

    const errors = performanceMonitoringService.getErrors(10);
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe('Test error');
    expect(errors[0].severity).toBe('high');
    expect(errors[0].type).toBe('client');
  });

  test('should generate optimization suggestions', () => {
    const suggestions = performanceMonitoringService.getSuggestions();
    
    expect(suggestions.length).toBeGreaterThan(0);
    
    // Check that suggestions have required properties
    suggestions.forEach(suggestion => {
      expect(suggestion.id).toBeDefined();
      expect(suggestion.category).toBeDefined();
      expect(suggestion.priority).toBeDefined();
      expect(suggestion.title).toBeDefined();
      expect(suggestion.description).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(suggestion.priority);
      expect(['performance', 'security', 'usability', 'code', 'infrastructure']).toContain(suggestion.category);
    });
  });

  test('should handle metrics callbacks', () => {
    const mockCallback = vi.fn();
    
    // Subscribe to metrics updates
    const unsubscribe = performanceMonitoringService.onMetricsUpdate(mockCallback);
    
    // Start monitoring to trigger updates
    performanceMonitoringService.startMonitoring();
    
    // Wait a bit for the callback to be called
    setTimeout(() => {
      expect(mockCallback).toHaveBeenCalled();
      unsubscribe();
    }, 100);
  });

  test('should handle alert callbacks', () => {
    const mockCallback = vi.fn();
    
    // Subscribe to alerts
    const unsubscribe = performanceMonitoringService.onAlert(mockCallback);
    
    // Report a high severity error to trigger an alert
    performanceMonitoringService.reportError({
      type: 'server',
      severity: 'critical',
      message: 'Critical error for alert test'
    });

    // Check that alert was created
    const alerts = performanceMonitoringService.getAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    
    unsubscribe();
  });

  test('should export data in correct format', () => {
    // Add some test data
    performanceMonitoringService.reportError({
      type: 'client',
      severity: 'medium',
      message: 'Test error for export'
    });

    // Test JSON export
    const jsonData = performanceMonitoringService.exportData('json');
    const parsedData = JSON.parse(jsonData);
    
    expect(parsedData.metrics).toBeDefined();
    expect(parsedData.errors).toBeDefined();
    expect(parsedData.suggestions).toBeDefined();
    expect(parsedData.alerts).toBeDefined();
    expect(parsedData.timestamp).toBeDefined();

    // Test CSV export
    const csvData = performanceMonitoringService.exportData('csv');
    expect(csvData).toContain('Metric,Value,Unit');
    expect(csvData).toContain('Response Time');
    expect(csvData).toContain('Throughput');
  });

  test('should resolve alerts correctly', () => {
    // Report error to create alert
    performanceMonitoringService.reportError({
      type: 'server',
      severity: 'critical',
      message: 'Test error for alert resolution'
    });

    const alerts = performanceMonitoringService.getAllAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    
    const firstAlert = alerts[0];
    expect(firstAlert.resolved).toBe(false);
    
    // Resolve the alert
    performanceMonitoringService.resolveAlert(firstAlert.id);
    
    // Check that alert is resolved
    const updatedAlerts = performanceMonitoringService.getAllAlerts();
    const resolvedAlert = updatedAlerts.find(a => a.id === firstAlert.id);
    expect(resolvedAlert?.resolved).toBe(true);
  });
});
