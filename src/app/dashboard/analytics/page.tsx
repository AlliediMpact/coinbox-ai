'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, TrendingUp } from 'lucide-react';
import AdvancedAnalyticsDashboard from '@/components/AdvancedAnalyticsDashboard';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                Analytics & Insights
              </h1>
              <p className="text-gray-600 mt-1">Comprehensive trading and performance analytics</p>
            </div>
          </div>
        </div>

        {/* Analytics Content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Your Trading Analytics
              </CardTitle>
              <CardDescription>
                Detailed insights into your trading performance, risk metrics, and investment trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedAnalyticsDashboard userId={user.uid} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
