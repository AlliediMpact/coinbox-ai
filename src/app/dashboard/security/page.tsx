'use client';

import { useState } from 'react';
import TransactionSecurity from '@/components/TransactionSecurity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Lock, Activity, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState('monitoring');

  return (
    <div className="security-page">
      <h1 className="text-2xl font-bold mb-2">Account Security</h1>
      <p className="text-muted-foreground mb-6">
        Monitor and manage your account security settings
      </p>

      <Tabs defaultValue="monitoring" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitoring" className="flex items-center">
            <ShieldAlert className="h-4 w-4 mr-1" />
            <span>Transaction Monitoring</span>
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center">
            <Lock className="h-4 w-4 mr-1" />
            <span>Access Control</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center">
            <Activity className="h-4 w-4 mr-1" />
            <span>Activity Log</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <TransactionSecurity />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Security Recommendations
              </CardTitle>
              <CardDescription>
                Suggestions to improve your account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Lock className="h-4 w-4" />
                <AlertTitle>Enable Two-Factor Authentication</AlertTitle>
                <AlertDescription>
                  Enhance your account security by enabling two-factor authentication. 
                  This adds an extra layer of protection to your account.
                </AlertDescription>
              </Alert>

              <Alert className="bg-blue-50 border-blue-200">
                <Activity className="h-4 w-4" />
                <AlertTitle>Regular Security Checks</AlertTitle>
                <AlertDescription>
                  Regularly review your account activity and transaction history to spot any unauthorized actions.
                </AlertDescription>
              </Alert>

              <Alert className="bg-blue-50 border-blue-200">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Verify Your Identity</AlertTitle>
                <AlertDescription>
                  Complete all KYC verification steps to ensure full access to platform features and improved security.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>
                Manage your account access settings and security features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Access control settings will be available soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Review recent activity on your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Activity log will be available soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
