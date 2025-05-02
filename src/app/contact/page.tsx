'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

const ContactPage = () => {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
            <p className="text-lg text-gray-300 mb-4">Reach out to us for support or inquiries.</p>
            <p className="text-lg text-gray-300 mb-8">
                Email: support@example.com<br />
                Phone: +1 (555) 123-4567
            </p>
            <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
    );
};

export default ContactPage;
