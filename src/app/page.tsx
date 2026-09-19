"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { AdminDashboard } from "@/components/AdminDashboard";

export default function HomePage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}
