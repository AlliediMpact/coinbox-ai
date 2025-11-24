'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs,
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { systemMonitoring, SystemHealthStatus, MonitoringAlert } from '@/lib/system-monitoring';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCcw,
  Download,
  Database,
  Clock,
  Layers,
  Search,
  Gauge
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function SystemMonitoringDashboard() {
  const { user, userClaims } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<SystemHealthStatus | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<MonitoringAlert[]>([]);
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  
  // Mock system metrics data
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  // Check if user has admin access
  const isAdmin = userClaims?.role === 'admin';

  useEffect(() => {
    if (user && isAdmin) {
      loadSystemStatus();
      loadActiveAlerts();
      generateMockPerformanceData();
      
      // Set mock last backup time
      setLastBackupTime(format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'PPP p'));
      
      // Set up refresh interval (every 2 minutes)
      const interval = setInterval(loadSystemStatus, 120000);
      
      return () => clearInterval(interval);
    }
  }, [user, isAdmin]);

  const loadSystemStatus = async () => {
    try {
      setLoading(true);
      const status = await systemMonitoring.checkSystemHealth();
      setHealthStatus(status);
    } catch (error) {
      console.error('Failed to load system status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load system health status',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadActiveAlerts = async () => {
    try {
      // In a real app, would fetch from system monitoring service
      // Mocking some alerts for now
      setActiveAlerts([
        {
          id: 'alert_1',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          severity: 'high',
          title: 'High CPU Usage',
          message: 'Server CPU usage has exceeded 90% for more than 10 minutes',
          component: 'server',
          status: 'active'
        },
        {
          id: 'alert_2',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          severity: 'medium',
          title: 'API Latency Increase',
          message: 'Transaction API response time has increased by 200%',
          component: 'api',
          status: 'acknowledged',
          acknowledgedBy: 'admin@example.com'
        }
      ]);
    } catch (error) {
      console.error('Failed to load active alerts:', error);
    }
  };

  const generateMockPerformanceData = () => {
    // Generate 24 hours of mock performance data
    const data = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: format(time, 'HH:00'),
        cpu: Math.round(40 + Math.random() * 30),
        memory: Math.round(50 + Math.random() * 20),
        responseTime: Math.round(100 + Math.random() * 150),
        users: Math.round(50 + Math.sin(i/3) * 30)
      });
    }
    
    setPerformanceData(data);
  };

  const initiateBackup = async () => {
    try {
      setIsBackupInProgress(true);
      toast({
        title: 'Backup Started',
        description: 'System backup has been initiated'
      });
      
      // In a real app, this would call systemMonitoring.createBackup()
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setLastBackupTime(format(new Date(), 'PPP p'));
      toast({
        title: 'Backup Complete',
        description: 'System backup was successful'
      });
    } catch (error) {
      console.error('Backup failed:', error);
      toast({
        title: 'Backup Failed',
        description: 'Failed to create system backup',
        variant: 'destructive'
      });
    } finally {
      setIsBackupInProgress(false);
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    // In a real app, this would call systemMonitoring.updateAlertStatus()
    setActiveAlerts(alerts => 
      alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'acknowledged', acknowledgedBy: user?.email || 'admin' } 
          : alert
      )
    );
    
    toast({
      title: 'Alert Acknowledged',
      description: `Alert ${alertId} has been acknowledged`
    });
  };

  const resolveAlert = (alertId: string) => {
    // In a real app, this would call systemMonitoring.updateAlertStatus()
    setActiveAlerts(alerts => alerts.filter(alert => alert.id !== alertId));
    
    toast({
      title: 'Alert Resolved',
      description: `Alert ${alertId} has been marked as resolved`
    });
  };

  // Helper function to render status indicator
  const renderStatusIndicator = (status: 'operational' | 'degraded' | 'outage') => {
    if (status === 'operational') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (status === 'degraded') {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  // If not admin, don't show the dashboard
  if (!user || !isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <p>You don&apos;t have permission to access system monitoring.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">System Monitoring</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={loadSystemStatus}
          disabled={loading}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {healthStatus && Object.entries(healthStatus.components).map(([name, component]) => (
          <Card key={name}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium capitalize">{name}</CardTitle>
                {renderStatusIndicator(component.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {component.metrics?.responseTime || 0}ms
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Last checked: {format(new Date(component.lastChecked), &apos;HH:mm:ss&apos;)}
              </p>
              {component.metrics?.uptime && (
                <div className="mt-2">
                  <p className="text-xs font-medium">Uptime</p>
                  <div className="flex items-center mt-1">
                    <Progress value={component.metrics.uptime} className="h-1 flex-1" />
                    <span className="text-xs ml-2">{component.metrics.uptime}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="backup">Backup & Recovery</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>24-hour performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={performanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU Usage %" />
                    <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory Usage %" />
                    <Line type="monotone" dataKey="responseTime" stroke="#ff7300" name="Avg Response Time (ms)" />
                    <Line type="monotone" dataKey="users" stroke="#0088FE" name="Active Users" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Resource Utilization</CardTitle>
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>CPU Usage</span>
                    <span className="font-medium">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span className="font-medium">51%</span>
                  </div>
                  <Progress value={51} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Database Connections</span>
                    <span className="font-medium">34%</span>
                  </div>
                  <Progress value={34} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Network I/O</span>
                    <span className="font-medium">82%</span>
                  </div>
                  <Progress value={82} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Service Status</CardTitle>
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Authentication Service</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Operational</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Payment Processing</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Operational</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">API Gateway</TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-500">Degraded</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Database Cluster</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Operational</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">File Storage</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Operational</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>
                System alerts that require attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeAlerts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Alert</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Badge className={
                            alert.severity === 'critical' ? 'bg-red-500' : 
                            alert.severity === 'high' ? 'bg-orange-500' : 
                            alert.severity === 'medium' ? 'bg-yellow-500' : 
                            'bg-blue-500'
                          }>
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {alert.title}
                          <p className="text-xs text-muted-foreground mt-1">
                            {alert.message}
                          </p>
                        </TableCell>
                        <TableCell>{alert.component}</TableCell>
                        <TableCell>{format(new Date(alert.timestamp), 'HH:mm:ss&apos;)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            alert.status === 'active' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {alert.status.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {alert.status === &apos;active&apos; && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => acknowledgeAlert(alert.id!)}
                              >
                                Acknowledge
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              onClick={() => resolveAlert(alert.id!)}
                            >
                              Resolve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-40">
                  <CheckCircle className="h-10 w-10 text-green-500 mb-4" />
                  <p className="text-muted-foreground">No active alerts at the moment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>System Logs</CardTitle>
                  <CardDescription>
                    Recent system logs and events
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" /> 
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" /> 
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Mock log data */}
                  {[...Array(10)].map((_, i) => {
                    const logTypes = ['info', 'warn', 'error', 'debug'];
                    const components = ['authentication', 'database', 'api', 'payment', 'system'];
                    const messages = [
                      'User login successful',
                      'Database connection pool at 80% capacity',
                      'API request failed with status 500',
                      'Payment processing completed',
                      &apos;System health check completed&apos;
                    ];
                    
                    const type = logTypes[Math.floor(Math.random() * logTypes.length)];
                    const component = components[Math.floor(Math.random() * components.length)];
                    const message = messages[Math.floor(Math.random() * messages.length)];
                    const time = new Date(Date.now() - i * 1000 * 60 * Math.random() * 10);
                    
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{format(time, 'HH:mm:ss&apos;)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            type === 'error' ? 'bg-red-100 text-red-800' : 
                            type === 'warn' ? 'bg-yellow-100 text-yellow-800' : 
                            type === 'info' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {type.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>{component}</TableCell>
                        <TableCell>{message}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <div className="flex justify-between w-full items-center">
                <p className="text-sm text-muted-foreground">Showing recent 10 logs</p>
                <Button variant="ghost" size="sm">
                  View All Logs
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Backup & Recovery</CardTitle>
                  <CardDescription>
                    Manage system backups and restore operations
                  </CardDescription>
                </div>
                <Button 
                  onClick={initiateBackup} 
                  disabled={isBackupInProgress}
                >
                  {isBackupInProgress ? (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                      Backing up...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Create Backup
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Automatic Backup Schedule</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Full system backups are performed daily at 3:00 AM. 
                      Incremental backups run every 6 hours.
                    </p>
                  </div>
                </div>
              </div>
              
              <h3 className="font-medium mb-4">Recent Backups</h3>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Backup Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{lastBackupTime || 'Never&apos;}</TableCell>
                    <TableCell>Full</TableCell>
                    <TableCell>2.7 GB</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Completed</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Restore
                        </Button>
                        <Button size="sm" variant="outline">
                          Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{format(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 'PPP p&apos;)}</TableCell>
                    <TableCell>Full</TableCell>
                    <TableCell>2.5 GB</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Completed</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Restore
                        </Button>
                        <Button size="sm" variant="outline">
                          Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{format(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 'PPP p&apos;)}</TableCell>
                    <TableCell>Full</TableCell>
                    <TableCell>2.4 GB</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Completed</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Restore
                        </Button>
                        <Button size="sm" variant="outline">
                          Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recovery Options</CardTitle>
              <CardDescription>
                Configure system recovery settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-secondary p-4 rounded-md">
                  <h4 className="font-medium">Point-in-time Recovery</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    The system can be restored to any point in the last 30 days using transaction logs.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Configure
                  </Button>
                </div>
                
                <div className="bg-secondary p-4 rounded-md">
                  <h4 className="font-medium">Disaster Recovery</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    In case of catastrophic failure, the system can be restored using geo-replicated backups.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Test Recovery
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
