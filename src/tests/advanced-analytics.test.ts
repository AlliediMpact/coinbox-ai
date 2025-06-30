import { describe, test, expect, vi, beforeEach } from 'vitest';
import { advancedAnalyticsService, AnalyticsMetrics, PredictiveAnalytics } from '../lib/advanced-analytics-service';

describe('Advanced Analytics Service', () => {
  beforeEach(() => {
    // Reset any cached data
    vi.clearAllMocks();
  });

  test('should initialize analytics service', () => {
    expect(advancedAnalyticsService).toBeDefined();
  });

  test('should generate analytics metrics', async () => {
    const metrics = await advancedAnalyticsService.getAnalyticsMetrics('7d');
    
    expect(metrics).toBeDefined();
    expect(metrics.overview).toBeDefined();
    expect(metrics.userMetrics).toBeDefined();
    expect(metrics.transactionMetrics).toBeDefined();
    expect(metrics.revenueMetrics).toBeDefined();
    expect(metrics.performanceMetrics).toBeDefined();

    // Check overview metrics
    expect(typeof metrics.overview.totalUsers).toBe('number');
    expect(typeof metrics.overview.activeUsers).toBe('number');
    expect(typeof metrics.overview.totalTransactions).toBe('number');
    expect(typeof metrics.overview.totalRevenue).toBe('number');

    // Check user metrics
    expect(Array.isArray(metrics.userMetrics.growthData)).toBe(true);
    expect(Array.isArray(metrics.userMetrics.retentionData)).toBe(true);
    expect(Array.isArray(metrics.userMetrics.segmentData)).toBe(true);

    // Check transaction metrics
    expect(Array.isArray(metrics.transactionMetrics.volumeData)).toBe(true);
    expect(Array.isArray(metrics.transactionMetrics.typeDistribution)).toBe(true);
  });

  test('should generate predictive analytics', async () => {
    const predictions = await advancedAnalyticsService.getPredictiveAnalytics();
    
    expect(predictions).toBeDefined();
    expect(predictions.userGrowthPrediction).toBeDefined();
    expect(predictions.revenuePrediction).toBeDefined();
    expect(predictions.churnPrediction).toBeDefined();
    expect(predictions.transactionVolumePrediction).toBeDefined();

    // Check prediction structure
    expect(Array.isArray(predictions.userGrowthPrediction)).toBe(true);
    expect(Array.isArray(predictions.revenuePrediction)).toBe(true);
    expect(typeof predictions.churnPrediction.riskScore).toBe('number');
    expect(Array.isArray(predictions.churnPrediction.highRiskUsers)).toBe(true);
  });

  test('should get user insights', async () => {
    const testUserId = 'test-user-123';
    const insights = await advancedAnalyticsService.getUserInsights(testUserId);
    
    expect(insights).toBeDefined();
    expect(insights.profile).toBeDefined();
    expect(insights.tradingBehavior).toBeDefined();
    expect(insights.riskProfile).toBeDefined();
    expect(insights.recommendations).toBeDefined();

    // Check profile data
    expect(typeof insights.profile.totalTransactions).toBe('number');
    expect(typeof insights.profile.totalVolume).toBe('number');
    expect(typeof insights.profile.accountAge).toBe('number');
    expect(typeof insights.profile.activityScore).toBe('number');

    // Check risk profile
    expect(['Low', 'Medium', 'High', 'Very High']).toContain(insights.riskProfile.riskLevel);
    expect(typeof insights.riskProfile.riskScore).toBe('number');
    expect(Array.isArray(insights.riskProfile.riskFactors)).toBe(true);

    // Check recommendations
    expect(Array.isArray(insights.recommendations)).toBe(true);
  });

  test('should export analytics data', async () => {
    const timeRange = '30d';
    
    // Test JSON export
    const jsonData = await advancedAnalyticsService.exportAnalytics(timeRange, 'json');
    expect(typeof jsonData).toBe('string');
    
    const parsedData = JSON.parse(jsonData);
    expect(parsedData.metrics).toBeDefined();
    expect(parsedData.timeRange).toBe(timeRange);
    expect(parsedData.exportedAt).toBeDefined();

    // Test CSV export
    const csvData = await advancedAnalyticsService.exportAnalytics(timeRange, 'csv');
    expect(typeof csvData).toBe('string');
    expect(csvData).toContain('Date,Users,Transactions,Revenue');

    // Test PDF export (should return base64 string)
    const pdfData = await advancedAnalyticsService.exportAnalytics(timeRange, 'pdf');
    expect(typeof pdfData).toBe('string');
    expect(pdfData.length).toBeGreaterThan(0);
  });

  test('should handle different time ranges', async () => {
    const timeRanges = ['7d', '30d', '90d', '1y'];
    
    for (const range of timeRanges) {
      const metrics = await advancedAnalyticsService.getAnalyticsMetrics(range);
      expect(metrics).toBeDefined();
      expect(metrics.overview).toBeDefined();
    }
  });

  test('should calculate revenue metrics correctly', async () => {
    const metrics = await advancedAnalyticsService.getAnalyticsMetrics('30d');
    
    expect(metrics.revenueMetrics).toBeDefined();
    expect(Array.isArray(metrics.revenueMetrics.revenueData)).toBe(true);
    expect(Array.isArray(metrics.revenueMetrics.commissionData)).toBe(true);
    expect(Array.isArray(metrics.revenueMetrics.sourceBreakdown)).toBe(true);

    // Check revenue data structure
    if (metrics.revenueMetrics.revenueData.length > 0) {
      const firstRevenue = metrics.revenueMetrics.revenueData[0];
      expect(firstRevenue.date).toBeDefined();
      expect(typeof firstRevenue.revenue).toBe('number');
      expect(typeof firstRevenue.transactions).toBe('number');
    }
  });

  test('should handle user segmentation', async () => {
    const metrics = await advancedAnalyticsService.getAnalyticsMetrics('30d');
    
    expect(metrics.userMetrics.segmentData).toBeDefined();
    expect(Array.isArray(metrics.userMetrics.segmentData)).toBe(true);

    // Check segment structure
    if (metrics.userMetrics.segmentData.length > 0) {
      const firstSegment = metrics.userMetrics.segmentData[0];
      expect(firstSegment.segment).toBeDefined();
      expect(typeof firstSegment.users).toBe('number');
      expect(typeof firstSegment.percentage).toBe('number');
    }
  });

  test('should track performance metrics', async () => {
    const metrics = await advancedAnalyticsService.getAnalyticsMetrics('7d');
    
    expect(metrics.performanceMetrics).toBeDefined();
    expect(typeof metrics.performanceMetrics.averageResponseTime).toBe('number');
    expect(typeof metrics.performanceMetrics.uptime).toBe('number');
    expect(typeof metrics.performanceMetrics.errorRate).toBe('number');
    expect(typeof metrics.performanceMetrics.throughput).toBe('number');
  });
});
