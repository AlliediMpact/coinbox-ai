'use client';

import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield } from "lucide-react";
import EnhancedDisputeManagement from "@/components/disputes/EnhancedDisputeManagement";

export default function UserDisputesPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">My Disputes</h1>
      <EnhancedDisputeManagement />
    </div>
  );
}
