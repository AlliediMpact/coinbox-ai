import { db } from './firebase';

export interface AnalyticsMetrics {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    retentionRate: number;
    byMembershipTier: Record<string, number>;
  };
  transactions: {
    total: number;
    volume: number;
    averageAmount: number;
    successRate: number;
    byType: Record<string, { count: number; volume: number }>;
    monthlyTrend: Array<{ month: string; count: number; volume: number }>;
  };
  loans: {
    totalIssued: number;
    totalVolume: number;
    defaultRate: number;
    averageAmount: number;
    repaymentRate: number;
    riskDistribution: Record<string, number>;
  };
  commissions: {
    totalPaid: number;
    pendingAmount: number;
    topReferrers: Array<{ userId: string; amount: number; referrals: number }>;
    monthlyPayouts: Array<{ month: string; amount: number; count: number }>;
  };
  financial: {
    revenue: {
      total: number;
      monthly: number;
      bySource: Record<string, number>;
    };
    costs: {
      commissions: number;
      operational: number;
      defaults: number;
    };
    profit: number;
    margins: number;
  };
  system: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    activeConnections: number;
  };
}

export interface AdvancedAnalyticsFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  membershipTiers?: string[];
  transactionTypes?: string[];
  riskLevels?: string[];
  userSegments?: string[];
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  filters: AdvancedAnalyticsFilters;
  metrics: string[];
  schedule?: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  createdAt: Date;
  lastGenerated?: Date;
}

export interface PredictiveAnalytics {
  userGrowth: {
    prediction: number[];
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  transactionVolume: {
    prediction: number[];
    seasonality: string[];
    anomalies: Array<{ date: Date; severity: number; description: string }>;
  };
  defaultRisk: {
    prediction: number;
    riskFactors: string[];
    recommendations: string[];
  };
  revenue: {
    forecast: number[];
    scenarios: Record<string, number[]>;
    confidence: number;
  };
}

class AdvancedAnalyticsService {
  
  // Get comprehensive analytics metrics
  async getAnalyticsMetrics(filters?: AdvancedAnalyticsFilters): Promise<AnalyticsMetrics> {
    try {
      const dateRange = filters?.dateRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const [
        userMetrics,
        transactionMetrics,
        loanMetrics,
        commissionMetrics,
        financialMetrics,
        systemMetrics
      ] = await Promise.all([
        this.getUserMetrics(dateRange),
        this.getTransactionMetrics(dateRange),
        this.getLoanMetrics(dateRange),
        this.getCommissionMetrics(dateRange),
        this.getFinancialMetrics(dateRange),
        this.getSystemMetrics()
      ]);

      return {
        users: userMetrics,
        transactions: transactionMetrics,
        loans: loanMetrics,
        commissions: commissionMetrics,
        financial: financialMetrics,
        system: systemMetrics
      };
    } catch (error) {
      console.error('Error getting analytics metrics:', error);
      throw new Error('Analytics data retrieval failed');
    }
  }

  // Generate predictive analytics
  async getPredictiveAnalytics(timeframe: number = 90): Promise<PredictiveAnalytics> {
    try {
      // Get historical data for predictions
      const historicalData = await this.getHistoricalData(timeframe * 2);
      
      return {
        userGrowth: this.predictUserGrowth(historicalData.users, timeframe),
        transactionVolume: this.predictTransactionVolume(historicalData.transactions, timeframe),
        defaultRisk: this.predictDefaultRisk(historicalData.loans),
        revenue: this.predictRevenue(historicalData.financial, timeframe)
      };
    } catch (error) {
      console.error('Error generating predictive analytics:', error);
      throw new Error('Predictive analytics generation failed');
    }
  }

  // Create custom report
  async createCustomReport(report: Omit<CustomReport, 'id' | 'createdAt'>): Promise<CustomReport> {
    try {
      const customReport: CustomReport = {
        ...report,
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      };

      // In a real implementation, save to reports collection
      console.log('Custom report created:', customReport);
      
      return customReport;
    } catch (error) {
      console.error('Error creating custom report:', error);
      throw new Error('Custom report creation failed');
    }
  }

  // Generate and export report
  async generateReport(reportId: string, format: CustomReport['format']): Promise<Blob> {
    try {
      const report = await this.getCustomReport(reportId);
      const data = await this.getAnalyticsMetrics(report.filters);
      
      switch (format) {
        case 'pdf':
          return this.generatePDFReport(data, report);
        case 'excel':
          return this.generateExcelReport(data, report);
        case 'csv':
          return this.generateCSVReport(data, report);
        case 'json':
          return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        default:
          throw new Error('Unsupported format');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Report generation failed');
    }
  }

  // Real-time analytics stream
  async getRealtimeMetrics(): Promise<{
    activeUsers: number;
    ongoingTransactions: number;
    systemLoad: number;
    alertsCount: number;
    recentActivity: Array<{ type: string; timestamp: Date; description: string }>;
  }> {
    try {
      // In a real implementation, this would connect to real-time data streams
      return {
        activeUsers: Math.floor(Math.random() * 150) + 50,
        ongoingTransactions: Math.floor(Math.random() * 25) + 5,
        systemLoad: Math.random() * 100,
        alertsCount: Math.floor(Math.random() * 3),
        recentActivity: [
          { type: 'transaction', timestamp: new Date(), description: 'New loan application submitted' },
          { type: 'user', timestamp: new Date(Date.now() - 300000), description: 'User completed KYC verification' },
          { type: 'commission', timestamp: new Date(Date.now() - 600000), description: 'Commission payout processed' }
        ]
      };
    } catch (error) {
      console.error('Error getting realtime metrics:', error);
      throw new Error('Realtime metrics retrieval failed');
    }
  }

  // A/B Testing Analytics
  async getABTestResults(testId: string): Promise<{
    testName: string;
    variants: Array<{
      name: string;
      users: number;
      conversions: number;
      conversionRate: number;
      confidence: number;
    }>;
    winner?: string;
    significanceLevel: number;
  }> {
    try {
      // Mock A/B test results
      return {
        testName: 'Loan Application Flow',
        variants: [
          { name: 'Control', users: 1000, conversions: 120, conversionRate: 12.0, confidence: 95 },
          { name: 'Variant A', users: 1000, conversions: 145, conversionRate: 14.5, confidence: 98 }
        ],
        winner: 'Variant A',
        significanceLevel: 0.05
      };
    } catch (error) {
      console.error('Error getting A/B test results:', error);
      throw new Error('A/B test results retrieval failed');
    }
  }

  // Cohort Analysis
  async getCohortAnalysis(cohortType: 'weekly' | 'monthly'): Promise<{
    cohorts: Array<{
      period: string;
      users: number;
      retention: number[];
    }>;
    averageRetention: number[];
  }> {
    try {
      // Mock cohort data
      const cohorts = [];
      const periods = cohortType === 'weekly' ? 12 : 6;
      
      for (let i = 0; i < periods; i++) {
        const baseRetention = 100;
        const retention = [baseRetention];
        
        // Generate declining retention rates
        for (let j = 1; j <= 12; j++) {
          const rate = baseRetention * Math.pow(0.85, j) + Math.random() * 10;
          retention.push(Math.max(0, rate));
        }
        
        cohorts.push({
          period: cohortType === 'weekly' ? `Week ${i + 1}` : `Month ${i + 1}`,
          users: 100 + Math.floor(Math.random() * 200),
          retention
        });
      }
      
      // Calculate average retention
      const averageRetention = [];
      for (let i = 0; i < 13; i++) {
        const avg = cohorts.reduce((sum, cohort) => sum + cohort.retention[i], 0) / cohorts.length;
        averageRetention.push(avg);
      }
      
      return { cohorts, averageRetention };
    } catch (error) {
      console.error('Error getting cohort analysis:', error);
      throw new Error('Cohort analysis retrieval failed');
    }
  }

  // Private helper methods
  private async getUserMetrics(dateRange: { start: Date; end: Date }) {
    // Mock user metrics
    return {
      total: 2487,
      active: 1892,
      newThisMonth: 312,
      retentionRate: 78.5,
      byMembershipTier: {
        'Basic': 1245,
        'Ambassador': 687,
        'VIP': 398,
        'Business': 157
      }
    };
  }

  private async getTransactionMetrics(dateRange: { start: Date; end: Date }) {
    return {
      total: 15678,
      volume: 2847593.45,
      averageAmount: 181.67,
      successRate: 94.7,
      byType: {
        'loan': { count: 5234, volume: 1234567.89 },
        'investment': { count: 7845, volume: 1456789.12 },
        'membership': { count: 2599, volume: 156236.44 }
      },
      monthlyTrend: [
        { month: 'Jan', count: 1200, volume: 218450 },
        { month: 'Feb', count: 1350, volume: 245670 },
        { month: 'Mar', count: 1580, volume: 287340 },
        { month: 'Apr', count: 1420, volume: 258230 },
        { month: 'May', count: 1690, volume: 307890 },
        { month: 'Jun', count: 1780, volume: 324560 }
      ]
    };
  }

  private async getLoanMetrics(dateRange: { start: Date; end: Date }) {
    return {
      totalIssued: 5234,
      totalVolume: 1234567.89,
      defaultRate: 3.2,
      averageAmount: 236.12,
      repaymentRate: 96.8,
      riskDistribution: {
        'low': 2345,
        'medium': 1987,
        'high': 687,
        'very-high': 215
      }
    };
  }

  private async getCommissionMetrics(dateRange: { start: Date; end: Date }) {
    return {
      totalPaid: 156789.34,
      pendingAmount: 23456.78,
      topReferrers: [
        { userId: 'user1', amount: 12345.67, referrals: 89 },
        { userId: 'user2', amount: 9876.54, referrals: 67 },
        { userId: 'user3', amount: 7654.32, referrals: 45 }
      ],
      monthlyPayouts: [
        { month: 'Jan', amount: 25000, count: 150 },
        { month: 'Feb', amount: 28000, count: 168 },
        { month: 'Mar', amount: 32000, count: 192 },
        { month: 'Apr', amount: 29000, count: 174 },
        { month: 'May', amount: 35000, count: 210 },
        { month: 'Jun', amount: 38000, count: 228 }
      ]
    };
  }

  private async getFinancialMetrics(dateRange: { start: Date; end: Date }) {
    return {
      revenue: {
        total: 456789.12,
        monthly: 38000,
        bySource: {
          'transaction_fees': 123456.78,
          'membership_fees': 234567.89,
          'interest': 98764.45
        }
      },
      costs: {
        commissions: 156789.34,
        operational: 45678.90,
        defaults: 12345.67
      },
      profit: 241985.21,
      margins: 52.9
    };
  }

  private async getSystemMetrics() {
    return {
      uptime: 99.8,
      responseTime: 145,
      errorRate: 0.2,
      activeConnections: 1247
    };
  }

  private async getHistoricalData(days: number) {
    // Mock historical data for predictions
    return {
      users: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
        count: 2000 + Math.floor(Math.random() * 500)
      })),
      transactions: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
        count: 50 + Math.floor(Math.random() * 30),
        volume: 10000 + Math.random() * 5000
      })),
      loans: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
        defaults: Math.random() * 0.05
      })),
      financial: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
        revenue: 1000 + Math.random() * 500
      }))
    };
  }

  private predictUserGrowth(historicalUsers: any[], days: number) {
    // Simple linear regression for user growth prediction
    const growth = historicalUsers.length > 1 ? 
      (historicalUsers[historicalUsers.length - 1].count - historicalUsers[0].count) / historicalUsers.length : 0;
    
    const prediction = [];
    for (let i = 0; i < days; i++) {
      prediction.push(historicalUsers[historicalUsers.length - 1].count + (growth * i));
    }
    
    return {
      prediction,
      confidence: 85,
      trend: growth > 0 ? 'increasing' as const : growth < 0 ? 'decreasing' as const : 'stable' as const
    };
  }

  private predictTransactionVolume(historicalTransactions: any[], days: number) {
    const volumes = historicalTransactions.map(t => t.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    
    const prediction = [];
    for (let i = 0; i < days; i++) {
      prediction.push(avgVolume * (1 + Math.sin(i / 7) * 0.1)); // Weekly seasonality
    }
    
    return {
      prediction,
      seasonality: ['Monday: +5%', 'Tuesday: +10%', 'Wednesday: +15%', 'Thursday: +10%', 'Friday: +5%', 'Weekend: -10%'],
      anomalies: [
        { date: new Date(), severity: 0.3, description: 'Unusual spike in loan applications' }
      ]
    };
  }

  private predictDefaultRisk(historicalLoans: any[]) {
    const avgDefault = historicalLoans.reduce((sum, loan) => sum + loan.defaults, 0) / historicalLoans.length;
    
    return {
      prediction: avgDefault * 100,
      riskFactors: ['Economic uncertainty', 'Seasonal trends', 'New user influx'],
      recommendations: ['Tighten lending criteria', 'Increase monitoring', 'Review risk models']
    };
  }

  private predictRevenue(historicalFinancial: any[], days: number) {
    const revenues = historicalFinancial.map(f => f.revenue);
    const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    
    const forecast = [];
    for (let i = 0; i < days; i++) {
      forecast.push(avgRevenue * (1 + (i / days) * 0.1)); // 10% growth over period
    }
    
    return {
      forecast,
      scenarios: {
        optimistic: forecast.map(f => f * 1.2),
        realistic: forecast,
        pessimistic: forecast.map(f => f * 0.8)
      },
      confidence: 78
    };
  }

  private async getCustomReport(reportId: string): Promise<CustomReport> {
    // Mock report retrieval
    return {
      id: reportId,
      name: 'Monthly Performance Report',
      description: 'Comprehensive monthly performance analysis',
      filters: {
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      },
      metrics: ['users', 'transactions', 'revenue'],
      format: 'pdf',
      recipients: ['admin@coinbox.ai'],
      createdAt: new Date()
    };
  }

  private generatePDFReport(data: AnalyticsMetrics, report: CustomReport): Blob {
    // Mock PDF generation
    const content = `Analytics Report: ${report.name}\n\nGenerated: ${new Date()}\n\nData: ${JSON.stringify(data, null, 2)}`;
    return new Blob([content], { type: 'application/pdf' });
  }

  private generateExcelReport(data: AnalyticsMetrics, report: CustomReport): Blob {
    // Mock Excel generation
    const content = JSON.stringify(data, null, 2);
    return new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  private generateCSVReport(data: AnalyticsMetrics, report: CustomReport): Blob {
    // Mock CSV generation
    const content = Object.entries(data).map(([key, value]) => `${key},${JSON.stringify(value)}`).join('\n');
    return new Blob([content], { type: 'text/csv' });
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService();
