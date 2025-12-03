'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No new notifications.</p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
