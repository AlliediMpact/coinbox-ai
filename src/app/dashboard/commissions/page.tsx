'use client';

import CommissionTracking from "@/components/CommissionTracking";

export default function CommissionPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Commission Payout</h1>
      <CommissionTracking />
    </div>
  );
}
