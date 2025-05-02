'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

const AboutPage = () => {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold text-white mb-4">About Us</h1>
            <p className="text-lg text-gray-300 mb-8">
                Allied iMpact Coin Box is an innovative peer-to-peer (P2P) financial platform that provides users with a seamless, secure, and efficient way to invest and borrow digital assets.
            </p>
            <p className="text-lg text-gray-300 mb-8">
                Our mission is to provide an innovative, user-friendly, and secure digital marketplace where users can trade coins effortlessly, access instant loans, and earn commissions through referrals, all while ensuring financial inclusivity and transparency.
            </p>
            <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
    );
};

export default AboutPage;
