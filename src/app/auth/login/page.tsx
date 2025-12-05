'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, loading: authLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state if auth is still initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Card className="w-[450px]">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="w-[450px]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}