import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdvancedAnalyticsDashboard from '../components/AdvancedAnalyticsDashboard';
import PerformanceDashboard from '../components/PerformanceDashboard';
import PWAInstallPrompt from '../components/PWAInstallPrompt';

// Mock the chart library
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Mock the services
vi.mock('../lib/advanced-analytics-service', () => ({
  advancedAnalyticsService: {
    getAnalyticsMetrics: vi.fn(() => Promise.resolve({
      overview: {
        totalUsers: 1000,
        activeUsers: 750,
        totalTransactions: 5000,
        totalRevenue: 100000,
        growthRate: 15.5,
        retentionRate: 85.2
      },
      userMetrics: {
        growthData: [],
        retentionData: [],
        segmentData: []
      },
      transactionMetrics: {
        volumeData: [],
        typeDistribution: [],
        statusBreakdown: []
      },
      revenueMetrics: {
        revenueData: [],
        commissionData: [],
        sourceBreakdown: []
      },
      performanceMetrics: {
        averageResponseTime: 250,
        uptime: 99.9,
        errorRate: 0.1,
        throughput: 1200
      }
    })),
    getPredictiveAnalytics: vi.fn(() => Promise.resolve({
      userGrowthPrediction: [],
      revenuePrediction: [],
      churnPrediction: { riskScore: 15, highRiskUsers: [] },
      transactionVolumePrediction: []
    }))
  }
}));

vi.mock('../lib/performance-monitoring-service', () => ({
  default: {
    getMetrics: vi.fn(() => ({
      responseTime: 250,
      throughput: 1200,
      errorRate: 0.1,
      uptime: 99.9,
      memoryUsage: 65,
      cpuUsage: 45,
      databaseResponseTime: 50,
      cacheHitRatio: 95
    })),
    getErrors: vi.fn(() => []),
    getSuggestions: vi.fn(() => []),
    getAlerts: vi.fn(() => []),
    onMetricsUpdate: vi.fn(() => () => {}),
    onAlert: vi.fn(() => () => {}),
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    exportData: vi.fn(() => JSON.stringify({ test: 'data' }))
  }
}));

vi.mock('../lib/pwa-service', () => ({
  pwaService: {
    getStatus: vi.fn(() => ({
      isInstalled: false,
      isInstallable: true,
      isOnline: true,
      isServiceWorkerSupported: true,
      isServiceWorkerRegistered: true,
      installPromptEvent: null
    })),
    onStatusChange: vi.fn(() => () => {}),
    installApp: vi.fn(() => Promise.resolve({ success: true }))
  }
}));

describe('UI Components Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AdvancedAnalyticsDashboard', () => {
    test('should render analytics dashboard correctly', async () => {
      render(<AdvancedAnalyticsDashboard />);
      
      // Check for main title
      expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
      
      // Check for loading state initially
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      
      // Check for tab navigation
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Predictive')).toBeInTheDocument();
      expect(screen.getByText('User Insights')).toBeInTheDocument();
    });

    test('should display metrics correctly', async () => {
      render(<AdvancedAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument(); // Total users
        expect(screen.getByText('750')).toBeInTheDocument(); // Active users
        expect(screen.getByText('5,000')).toBeInTheDocument(); // Total transactions
      });
    });

    test('should handle tab switching', async () => {
      render(<AdvancedAnalyticsDashboard />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      
      // Click on Predictive tab
      fireEvent.click(screen.getByText('Predictive'));
      
      // Should show predictive content
      expect(screen.getByText('Predictive Analytics')).toBeInTheDocument();
    });

    test('should handle export functionality', async () => {
      render(<AdvancedAnalyticsDashboard />);
      
      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export/i });
        expect(exportButton).toBeInTheDocument();
      });
    });
  });

  describe('PerformanceDashboard', () => {
    test('should render performance dashboard correctly', async () => {
      render(<PerformanceDashboard />);
      
      // Check for main title
      expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
      
      // Check for performance metrics
      await waitFor(() => {
        expect(screen.getByText('Response Time')).toBeInTheDocument();
        expect(screen.getByText('Throughput')).toBeInTheDocument();
        expect(screen.getByText('Error Rate')).toBeInTheDocument();
      });
    });

    test('should display performance metrics correctly', async () => {
      render(<PerformanceDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('250')).toBeInTheDocument(); // Response time
        expect(screen.getByText('1200')).toBeInTheDocument(); // Throughput
        expect(screen.getByText('0.10')).toBeInTheDocument(); // Error rate
      });
    });

    test('should show monitoring status', async () => {
      render(<PerformanceDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Monitoring Active')).toBeInTheDocument();
      });
    });

    test('should handle export data functionality', async () => {
      render(<PerformanceDashboard />);
      
      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export data/i });
        expect(exportButton).toBeInTheDocument();
        
        fireEvent.click(exportButton);
        // Export functionality should be called
      });
    });
  });

  describe('PWAInstallPrompt', () => {
    test('should render PWA install prompt when installable', () => {
      render(<PWAInstallPrompt />);
      
      expect(screen.getByText('Install CoinBox AI')).toBeInTheDocument();
      expect(screen.getByText('Get the best experience with our mobile app')).toBeInTheDocument();
    });

    test('should show PWA features', () => {
      render(<PWAInstallPrompt />);
      
      expect(screen.getByText('Offline access')).toBeInTheDocument();
      expect(screen.getByText('Push notifications')).toBeInTheDocument();
      expect(screen.getByText('Faster loading')).toBeInTheDocument();
    });

    test('should handle install button click', async () => {
      const { pwaService } = await import('../lib/pwa-service');
      
      render(<PWAInstallPrompt />);
      
      const installButton = screen.getByRole('button', { name: /install app/i });
      expect(installButton).toBeInTheDocument();
      
      fireEvent.click(installButton);
      
      await waitFor(() => {
        expect(pwaService.installApp).toHaveBeenCalled();
      });
    });

    test('should handle dismiss functionality', () => {
      render(<PWAInstallPrompt />);
      
      const dismissButton = screen.getByRole('button', { name: /close/i });
      expect(dismissButton).toBeInTheDocument();
      
      fireEvent.click(dismissButton);
      
      // Component should disappear after dismiss
      expect(screen.queryByText('Install CoinBox AI')).not.toBeInTheDocument();
    });

    test('should show online/offline status', () => {
      render(<PWAInstallPrompt />);
      
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    test('should not render when not installable', () => {
      const { pwaService } = require('../lib/pwa-service');
      pwaService.getStatus.mockReturnValue({
        isInstalled: false,
        isInstallable: false,
        isOnline: true,
        isServiceWorkerSupported: true,
        isServiceWorkerRegistered: true,
        installPromptEvent: null
      });
      
      const { container } = render(<PWAInstallPrompt />);
      expect(container.firstChild).toBeNull();
    });

    test('should not render when already installed', () => {
      const { pwaService } = require('../lib/pwa-service');
      pwaService.getStatus.mockReturnValue({
        isInstalled: true,
        isInstallable: false,
        isOnline: true,
        isServiceWorkerSupported: true,
        isServiceWorkerRegistered: true,
        installPromptEvent: null
      });
      
      const { container } = render(<PWAInstallPrompt />);
      expect(container.firstChild).toBeNull();
    });
  });
});
