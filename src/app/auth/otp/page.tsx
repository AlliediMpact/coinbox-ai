'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OTPPage() {
  const [email, setEmail] = useState('');
  const [otp, setOTP] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implement OTP verification logic here
    console.log("Email:", email, "OTP:", otp);
    router.push('/dashboard'); // Redirect to dashboard after successful verification
  };

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="w-[450px]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Sign In with OTP</CardTitle>
          <CardDescription>Enter your email and OTP to sign in</CardDescription>
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
              type="text"
              placeholder="OTP"
              value={otp}
              onChange={(e) => setOTP(e.target.value)}
              required
            />
            <Button type="submit">Verify OTP</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
