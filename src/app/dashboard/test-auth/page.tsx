'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/AuthProvider';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  testStandardLogin,
  testRateLimiting,
  testAuthLogging,
  checkMfaStatus
} from '@/lib/auth-test-utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function TestAuthPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('standard');
  
  useEffect(() => {
    // Initialize with test email if available
    if (user) {
      setEmail(user.email || '');
    }
  }, [user]);
  
  const runTest = async (testType: string) => {
    setLoading(true);
    setResult([`Running ${testType} test...`]);
    
    try {
      let testResult;
      
      switch (testType) {
        case 'standard':
          testResult = await testStandardLogin(email, password);
          setResult([testResult]);
          break;
          
        case 'rate-limiting':
          const results = await testRateLimiting(email, password, 10);
          setResult(results);
          break;
          
        case 'logging':
          testResult = await testAuthLogging(email, 'SIGN_IN_SUCCESS');
          setResult([testResult]);
          break;
          
        case 'mfa':
          testResult = await checkMfaStatus();
          setResult([testResult]);
          break;
          
        default:
          setResult(['Invalid test type']);
      }
    } catch (error: any) {
      setResult([`Test error: ${error.message}`]);
      toast({
        title: 'Test Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-3xl">
        <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Authentication Testing Tool</CardTitle>
          <CardDescription>
            Test various authentication scenarios for the CoinBox platform
          </CardDescription>
          
          <Alert className="mt-4">
            <AlertTitle>Testing Tool</AlertTitle>
            <AlertDescription>
              This is a development tool and should not be exposed in production.
              Use it to validate authentication, rate limiting, MFA, and logging.
            </AlertDescription>
          </Alert>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Authentication Status</h3>
              <div className="p-4 border rounded-md">
                {user ? (
                  <div className="space-y-2">
                    <p><strong>Signed in as:</strong> {user.email}</p>
                    <p><strong>Email verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
                    <p><strong>User ID:</strong> {user.uid}</p>
                    <Button 
                      variant="outline" 
                      onClick={() => signOut()}
                    >
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <p>Not signed in</p>
                )}
              </div>
            </div>
            
            <Separator />
            
            <Tabs 
              defaultValue="standard" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="standard">Standard Login</TabsTrigger>
                <TabsTrigger value="rate-limiting">Rate Limiting</TabsTrigger>
                <TabsTrigger value="logging">Event Logging</TabsTrigger>
                <TabsTrigger value="mfa">MFA Status</TabsTrigger>
              </TabsList>
              
              <TabsContent value="standard" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-md font-medium">Test Standard Login Flow</h3>
                  <p className="text-sm text-muted-foreground">
                    This will attempt a normal sign-in with the provided credentials.
                  </p>
                  
                  <div className="space-y-2">
                    <Input 
                      placeholder="Email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                    <Input 
                      placeholder="Password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                  </div>
                  
                  <Button 
                    onClick={() => runTest('standard')}
                    disabled={loading || !email || !password}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Run Test
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="rate-limiting" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-md font-medium">Test Rate Limiting</h3>
                  <p className="text-sm text-muted-foreground">
                    This will make multiple failed login attempts to trigger rate limiting.
                  </p>
                  
                  <div className="space-y-2">
                    <Input 
                      placeholder="Email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                    <Input 
                      placeholder="Password (will be modified to cause failures)" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                  </div>
                  
                  <Button 
                    onClick={() => runTest('rate-limiting')}
                    disabled={loading || !email || !password}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Run Test
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="logging" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-md font-medium">Test Auth Event Logging</h3>
                  <p className="text-sm text-muted-foreground">
                    This will generate auth log entries to test the logging system.
                  </p>
                  
                  <div className="space-y-2">
                    <Input 
                      placeholder="Email (for log reference)" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                  </div>
                  
                  <Button 
                    onClick={() => runTest('logging')}
                    disabled={loading || !email}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Run Test
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="mfa" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-md font-medium">Test MFA Status</h3>
                  <p className="text-sm text-muted-foreground">
                    This will check if MFA is enabled for the current user.
                  </p>
                  
                  <Button 
                    onClick={() => runTest('mfa')}
                    disabled={loading || !user}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Check MFA Status
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            <Separator />
            
            {result.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Test Results</h3>
                <div className="p-4 border rounded-md bg-muted/50 max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap break-words text-sm">
                    {result.join('\n')}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Note: Test logs are stored in the database. Check the admin panel to view them.
          </p>
        </CardFooter>
      </Card>
    </div>
    </ProtectedRoute>
  );
}
