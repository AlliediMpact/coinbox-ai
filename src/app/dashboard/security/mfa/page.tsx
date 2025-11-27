export const dynamic = 'force-dynamic';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Lock, Loader2 } from 'lucide-react';
import MfaEnrollment from '@/components/MfaEnrollment';
import { useToast } from '@/hooks/use-toast';
import { mfaService } from '@/lib/mfa-service';

export default function MfaSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [enrolledFactors, setEnrolledFactors] = useState<any[]>([]);
  const [showEnrollment, setShowEnrollment] = useState(false);
  
  useEffect(() => {
    const checkMfaStatus = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const factors = await mfaService.listEnrolledFactors();
        setMfaEnabled(factors.length > 0);
        setEnrolledFactors(factors);
      } catch (error) {
        console.error('Error checking MFA status:', error);
        toast({
          title: 'Error',
          description: 'Failed to retrieve MFA status.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkMfaStatus();
  }, [user, toast]);
  
  const handleDisableMfa = async (factorUid: string) => {
    try {
      setLoading(true);
      await mfaService.unenrollFactor(factorUid);
      
      // Refresh the enrolled factors list
      const factors = await mfaService.listEnrolledFactors();
      setMfaEnabled(factors.length > 0);
      setEnrolledFactors(factors);
      
      toast({
        title: 'MFA Disabled',
        description: 'Two-factor authentication has been disabled for your account.',
      });
    } catch (error: any) {
      console.error('Error disabling MFA:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to disable two-factor authentication.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleMfaComplete = async () => {
    // Refresh the enrolled factors list
    try {
      setLoading(true);
      const factors = await mfaService.listEnrolledFactors();
      setMfaEnabled(factors.length > 0);
      setEnrolledFactors(factors);
      setShowEnrollment(false);
    } catch (error) {
      console.error('Error refreshing MFA status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTitle>Not Authorized</AlertTitle>
          <AlertDescription>
            You must be logged in to manage two-factor authentication.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by requiring a second verification step when you sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {mfaEnabled ? (
                <div className="space-y-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Two-factor authentication is enabled</AlertTitle>
                    <AlertDescription>
                      Your account is protected with an additional layer of security.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Enrolled authentication methods</h3>
                    {enrolledFactors.map((factor) => (
                      <div key={factor.uid} className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <p className="font-medium">{factor.displayName || 'Phone authentication'}</p>
                          <p className="text-sm text-muted-foreground">
                            Enrolled on {new Date(factor.enrollmentTime).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          variant="destructive" 
                          onClick={() => handleDisableMfa(factor.uid)}
                          disabled={loading}
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : showEnrollment ? (
                <MfaEnrollment 
                  onCompleted={handleMfaComplete} 
                  onCancel={() => setShowEnrollment(false)} 
                />
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertTitle>Two-factor authentication is not enabled</AlertTitle>
                    <AlertDescription>
                      We recommend enabling two-factor authentication for additional account security.
                    </AlertDescription>
                  </Alert>
                  
                  <Button onClick={() => setShowEnrollment(true)}>
                    Enable two-factor authentication
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
