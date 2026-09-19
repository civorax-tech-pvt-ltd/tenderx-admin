"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <p className="text-sm text-ink-400">Loading…</p>
      </div>
    );
  }

  if (!user.is_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 dark:bg-ink-950">
        <div className="w-full max-w-sm rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-sm dark:border-ink-800 dark:bg-ink-900">
          <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-100">Not authorized</h1>
          <p className="mt-2 text-sm text-ink-500">This account does not have admin access.</p>
          <button
            onClick={logout}
            className="mt-5 h-9 w-full rounded-lg border border-ink-200 text-sm font-medium text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-400 dark:hover:bg-ink-800"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
