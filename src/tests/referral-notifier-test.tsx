'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import { ReferralNotifier } from '@/components/referral/ReferralNotifier';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TestReferralNotifications() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'referral' | 'commission'>('referral');
  const [testResult, setTestResult] = useState<string | null>(null);

  // Function to create a test notification
  const createTestNotification = async () => {
    if (!user) {
      setTestResult('Error: Not logged in');
      return;
    }

    if (!message) {
      setTestResult('Error: Please enter a message');
      return;
    }

    try {
      setTestResult('Creating notification...');
      
      // Format the appropriate message based on type
      const notificationMessage = type === 'referral' 
        ? `New referral: ${message}`
        : `Commission earned: ${message}`;
      
      // Add notification to Firestore
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        type: type,
        message: notificationMessage,
        createdAt: serverTimestamp(),
        read: false,
        data: {
          amount: type === 'commission' ? parseFloat(message) || 0 : null,
          referralEmail: type === 'referral' ? message : null
        }
      });
      
      setTestResult('Notification created successfully!');
      setMessage('');
    } catch (error) {
      console.error('Error creating test notification:', error);
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Test Referral Notifications</CardTitle>
          <CardDescription>
            Create test notifications to verify the real-time notification system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="notification-type">Notification Type</Label>
            <div className="flex space-x-4">
              <Button
                variant={type === 'referral' ? 'default' : 'outline'}
                onClick={() => setType('referral')}
              >
                New Referral
              </Button>
              <Button
                variant={type === 'commission' ? 'default' : 'outline'}
                onClick={() => setType('commission')}
              >
                Commission Earned
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">
              {type === 'referral' ? 'Referral Email' : 'Commission Amount ($)'}
            </Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={type === 'referral' ? 'user@example.com' : '25.50'}
            />
          </div>
          
          <Button onClick={createTestNotification} className="w-full">
            Create Test Notification
          </Button>
          
          {testResult && (
            <div className={`mt-4 p-3 rounded-md ${testResult.startsWith('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {testResult}
            </div>
          )}
          
          <div className="mt-6 p-4 border rounded-md">
            <h3 className="font-medium mb-2">Preview Notification Component</h3>
            <ReferralNotifier />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
