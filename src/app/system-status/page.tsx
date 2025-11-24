'use client';

import React, { useState, useEffect } from 'react';
import { systemMonitoring } from '@/lib/system-monitoring';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function SystemStatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    // Load system status on mount and every minute thereafter
    loadSystemStatus();
    const interval = setInterval(loadSystemStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    try {
      setLoading(true);
      
      // In a real app, this would come from the systemMonitoring service
      const systemStatus = await systemMonitoring.checkSystemHealth();
      
      setStatus(systemStatus);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load system status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render status indicator
  const renderStatusIndicator = (status: 'operational' | 'degraded' | 'outage') => {
    if (status === 'operational') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (status === 'degraded') {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">CoinBox System Status</h1>
          <p className="text-sm text-muted-foreground">
            Updated {lastUpdated ? format(lastUpdated, 'MMM d, yyyy h:mm a') : 'Just now'}
          </p>
        </div>
        
        {/* Overall system status */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              {status?.status === 'operational' ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <h2 className="text-2xl font-bold">All Systems Operational</h2>
                    <p className="text-muted-foreground">All CoinBox services are running normally</p>
                  </div>
                </>
              ) : status?.status === &apos;degraded&apos; ? (
                <>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  <div>
                    <h2 className="text-2xl font-bold">Degraded Performance</h2>
                    <p className="text-muted-foreground">Some CoinBox services are experiencing issues</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <h2 className="text-2xl font-bold">System Outage</h2>
                    <p className="text-muted-foreground">Critical CoinBox services are unavailable</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Component status table */}
        <Card>
          <CardHeader>
            <CardTitle>Component Status</CardTitle>
            <CardDescription>Current status of all CoinBox services</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading system status...</p>
              </div>
            ) : status ? (
              <div className="space-y-4">
                {Object.entries(status.components).map(([name, component]) => (
                  <div key={name} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center">
                      {renderStatusIndicator(component.status)}
                      <span className="ml-2 capitalize">{name}</span>
                    </div>
                    <div>
                      <span className={`capitalize px-2 py-1 text-xs rounded-full ${
                        component.status === 'operational' ? 'bg-green-100 text-green-800' : 
                        component.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {component.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                <p>Unable to load system status. Please try again later.</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              If you&apos;re experiencing issues, please contact support at support@coinbox.com
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
