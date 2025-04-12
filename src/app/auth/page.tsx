'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from 'react';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/auth/signin'); // Redirect to sign-in page
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/auth/signup'); // Redirect to sign-up page
  };

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="w-[450px]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Authentication</CardTitle>
          <CardDescription>Choose your preferred method to sign in or sign up</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSignIn} className="grid gap-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit">Sign In with Email/Password</Button>
          </form>
          <Button variant="outline" onClick={() => router.push('/auth/otp')}>Sign In with OTP</Button>
          <Button onClick={handleSignUp}>Create Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
