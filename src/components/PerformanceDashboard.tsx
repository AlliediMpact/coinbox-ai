'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Download,
  Eye,
  MemoryStick,
  RefreshCw,
  Server,
  Wifi,
  Zap,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react';
import performanceMonitoringService, { 
  PerformanceMetrics, 
  ErrorReport, 
  OptimizationSuggestion, 
  RealTimeAlert 
} from '@/lib/performance-monitoring-service';

interface MetricCard {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export default function PerformanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [alerts, setAlerts] = useState<RealTimeAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    initializeMonitoring();
    return () => {
      performanceMonitoringService.stopMonitoring();
    };
  }, []);

  const initializeMonitoring = () => {
    setLoading(true);
    
    // Start monitoring
    performanceMonitoringService.startMonitoring();
    setIsMonitoring(true);

    // Get initial data
    setMetrics(performanceMonitoringService.getMetrics());
    setErrors(performanceMonitoringService.getErrors(20));
    setSuggestions(performanceMonitoringService.getSuggestions());
    setAlerts(performanceMonitoringService.getAlerts());

    // Subscribe to updates
    const unsubscribeMetrics = performanceMonitoringService.onMetricsUpdate((newMetrics) => {
      setMetrics(newMetrics);
      
      // Update historical data
      setHistoricalData(prev => {
        const newData = [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          responseTime: newMetrics.responseTime,
          throughput: newMetrics.throughput,
          errorRate: newMetrics.errorRate,
          cpuUsage: newMetrics.cpuUsage,
          memoryUsage: newMetrics.memoryUsage
        }];
        return newData.slice(-20); // Keep last 20 data points
      });
    });

    const unsubscribeAlerts = performanceMonitoringService.onAlert((alert) => {
      setAlerts(prev => [alert, ...prev]);
    });

    setLoading(false);

    // Cleanup function would be returned here in a real implementation
  };

  const getMetricCards = (): MetricCard[] => {
    if (!metrics) return [];

    return [
      {
        label: 'Response Time',
        value: Math.round(metrics.responseTime),
        unit: 'ms',
        icon: <Clock className="h-5 w-5" />,
        color: metrics.responseTime > 1000 ? 'text-red-500' : metrics.responseTime > 500 ? 'text-orange-500' : 'text-green-500',
        threshold: { warning: 500, critical: 1000 }
      },
      {
        label: 'Throughput',
        value: Math.round(metrics.throughput),
        unit: 'req/min',
        icon: <Activity className="h-5 w-5" />,
        color: 'text-blue-500'
      },
      {
        label: 'Error Rate',
        value: metrics.errorRate.toFixed(2),
        unit: '%',
        icon: <AlertTriangle className="h-5 w-5" />,
        color: metrics.errorRate > 5 ? 'text-red-500' : metrics.errorRate > 2 ? 'text-orange-500' : 'text-green-500',
        threshold: { warning: 2, critical: 5 }
      },
      {
        label: 'Uptime',
        value: metrics.uptime.toFixed(1),
        unit: '%',
        icon: <Server className="h-5 w-5" />,
        color: 'text-green-500'
      },
      {
        label: 'CPU Usage',
        value: Math.round(metrics.cpuUsage),
        unit: '%',
        icon: <Cpu className="h-5 w-5" />,
        color: metrics.cpuUsage > 80 ? 'text-red-500' : metrics.cpuUsage > 60 ? 'text-orange-500' : 'text-green-500',
        threshold: { warning: 60, critical: 80 }
      },
      {
        label: 'Memory Usage',
        value: Math.round(metrics.memoryUsage),
        unit: '%',
        icon: <MemoryStick className="h-5 w-5" />,
        color: metrics.memoryUsage > 80 ? 'text-red-500' : metrics.memoryUsage > 60 ? 'text-orange-500' : 'text-green-500',
        threshold: { warning: 60, critical: 80 }
      },
      {
        label: 'DB Response',
        value: Math.round(metrics.databaseResponseTime),
        unit: 'ms',
        icon: <Database className="h-5 w-5" />,
        color: metrics.databaseResponseTime > 500 ? 'text-red-500' : metrics.databaseResponseTime > 200 ? 'text-orange-500' : 'text-green-500',
        threshold: { warning: 200, critical: 500 }
      },
      {
        label: 'Cache Hit Ratio',
        value: metrics.cacheHitRatio.toFixed(1),
        unit: '%',
        icon: <Zap className="h-5 w-5" />,
        color: metrics.cacheHitRatio < 80 ? 'text-red-500' : metrics.cacheHitRatio < 90 ? 'text-orange-500' : 'text-green-500'
      }
    ];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const dismissAlert = (alertId: string) => {
    performanceMonitoringService.resolveAlert(alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const exportData = () => {
    const data = performanceMonitoringService.exportData('json');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const metricCards = getMetricCards();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">Real-time monitoring and optimization insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
            </span>
          </div>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Active Alerts ({alerts.length})
          </h3>
          {alerts.slice(0, 3).map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="font-medium text-red-800">{alert.message}</p>
                  <p className="text-sm text-red-600">{alert.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissAlert(alert.id)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${metric.color}`}>
                      {metric.value}
                    </span>
                    {metric.unit && (
                      <span className="text-sm text-gray-500">{metric.unit}</span>
                    )}
                  </div>
                  {metric.threshold && (
                    <div className="mt-2">
                      <Progress 
                        value={Math.min(100, (Number(metric.value) / metric.threshold.critical) * 100)} 
                        className="h-1"
                      />
                    </div>
                  )}
                </div>
                <div className={metric.color}>
                  {metric.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Performance Charts</TabsTrigger>
          <TabsTrigger value="errors">Error Reports</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="responseTime" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="cpuUsage" stackId="1" stroke="#ef4444" fill="#fef2f2" />
                    <Area type="monotone" dataKey="memoryUsage" stackId="2" stroke="#f59e0b" fill="#fefbeb" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Error Reports</CardTitle>
              <CardDescription>Latest system errors and issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {errors.slice(0, 10).map((error) => (
                  <div key={error.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getSeverityColor(error.severity)}>
                            {error.severity}
                          </Badge>
                          <Badge variant="outline">
                            {error.type}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {error.timestamp.toLocaleString()}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 mb-1">{error.message}</p>
                        {error.url && (
                          <p className="text-sm text-gray-600">URL: {error.url}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Suggestions</CardTitle>
              <CardDescription>Recommended improvements for better performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority} priority
                          </Badge>
                          <Badge variant="outline">
                            {suggestion.category}
                          </Badge>
                          {suggestion.automated && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Automated
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{suggestion.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Impact: {suggestion.estimatedImpact}</span>
                          <span>Effort: {suggestion.implementationEffort}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Learn More
                        </Button>
                        {suggestion.automated && (
                          <Button size="sm">
                            Apply Fix
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
