'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function P2PPage() {
  return (
    <ProtectedRoute>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>P2P Trading</CardTitle>
          </CardHeader>
          <CardContent>
            <p>P2P Trading feature coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
