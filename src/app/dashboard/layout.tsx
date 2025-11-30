'use client';

// Dashboard layout now simply renders its children.
// Auth gating and redirects are handled globally via AuthProvider
// and route-level logic, avoiding double-guards that can hide content.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
