'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function SwapPage() {
  return (
    <ProtectedRoute>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Swap</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Swap feature coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
