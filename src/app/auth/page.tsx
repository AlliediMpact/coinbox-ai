'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from 'react';
import { Mail, Key, Google, Facebook } from 'lucide-react'; // Import icons

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

  const handleGoogleSignIn = async () => {
    // Implement Google Sign-In logic here
    console.log("Signing in with Google");
  };

  const handleFacebookSignIn = async () => {
    // Implement Facebook Sign-In logic here
    console.log("Signing in with Facebook");
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
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/80">
              <Mail className="mr-2 h-4 w-4" />
              Sign In with Email/Password
            </Button>
          </form>
          <Button variant="outline" onClick={() => router.push('/auth/otp')}>
            <Key className="mr-2 h-4 w-4" />
            Sign In with OTP
          </Button>
          <Button onClick={handleSignUp}>Create Account</Button>

          <div className="flex justify-center gap-4 mt-4">
            <Button variant="secondary" onClick={handleGoogleSignIn}>
              <Google className="mr-2 h-4 w-4" />
              Sign In with Google
            </Button>
            <Button variant="secondary" onClick={handleFacebookSignIn}>
              <Facebook className="mr-2 h-4 w-4" />
              Sign In with Facebook
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const Label = React.forwardRef<HTMLLabelElement, React.HTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"
