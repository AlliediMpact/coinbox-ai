'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      router.push('/dashboard'); // Redirect to dashboard after successful sign in
    } catch (error: any) {
      // Handle sign-in errors (e.g., display error message)
      console.error("Failed to sign in:", error.message);
      alert(`Sign-in failed: ${error.message}`);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="w-[450px]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>Enter your email and password to sign in</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-2">
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
            <Button type="submit">Sign In</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
