"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { BillingQueue } from "@/components/BillingQueue";

export default function BillingPage() {
  return (
    <AdminGuard>
      <BillingQueue />
    </AdminGuard>
  );
}
