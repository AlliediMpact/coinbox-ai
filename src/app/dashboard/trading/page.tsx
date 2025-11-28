'use client';

export const dynamic = 'force-dynamic';

import CoinTrading from "@/components/CoinTrading";
import { useState, useEffect } from 'react';

export default function TradingPage() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="trading">
            <h1 className="text-2xl font-bold mb-4">Coin Trading</h1>
            {isClient && <CoinTrading />}
        </div>
    );
}
