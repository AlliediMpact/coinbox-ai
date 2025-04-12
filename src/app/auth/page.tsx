'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Authentication</h1>
      <div className="flex space-x-4">
        <Button onClick={() => router.push('/auth/signin')}>Sign In</Button>
        <Button onClick={() => router.push('/auth/signup')}>Sign Up</Button>
      </div>
    </div>
  );
}
