export const dynamic = 'force-dynamic';
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import ResendVerification from '@/components/ResendVerification';

export default function VerifyEmailPage() {
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [verified, setVerified] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { verifyEmail, resendVerificationEmail } = useAuth();
    const { toast } = useToast();
    const oobCode = searchParams.get('oobCode');

    useEffect(() => {
        const verifyEmailAddress = async () => {
            if (!oobCode) {
                setError('Invalid verification link');
                setVerifying(false);
                return;
            }

            try {
                await verifyEmail(oobCode);
                setVerified(true);
                toast({
                    title: "Email Verified",
                    description: "Your email has been successfully verified. You can now access all features.",
                });
                // Redirect to dashboard after 3 seconds
                setTimeout(() => router.push('/dashboard'), 3000);
            } catch (error: any) {
                setError(error.message || 'Failed to verify email');
                toast({
                    title: "Verification Failed",
                    description: error.message || 'Failed to verify email',
                    variant: "destructive",
                });
            } finally {
                setVerifying(false);
            }
        };

        verifyEmailAddress();
    }, [oobCode, verifyEmail, router, toast]);

    // Using our ResendVerification component instead

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-[450px]">
                <CardHeader>
                    <CardTitle className="text-2xl">Email Verification</CardTitle>
                    <CardDescription>
                        {verifying ? "Verifying your email address..." :
                         verified ? "Email verified successfully!" :
                         "Email verification failed"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center space-y-4">
                        {verifying ? (
                            <div className="flex flex-col items-center space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p>Please wait while we verify your email...</p>
                            </div>
                        ) : verified ? (
                            <div className="flex flex-col items-center space-y-4">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-green-700">
                                        Your email has been verified
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Redirecting you to the dashboard...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-4">
                                <XCircle className="h-16 w-16 text-red-500" />
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-red-700">
                                        {error}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        The verification link may have expired or is invalid.
                                    </p>
                                </div>
                                <div className="flex flex-col space-y-2 w-full">
                                    <ResendVerification />
                                    <Button 
                                        onClick={() => router.push('/auth')}
                                        className="w-full"
                                    >
                                        Back to Login
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}