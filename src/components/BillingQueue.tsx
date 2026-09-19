"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, QrCode, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { api, ApiError, API_URL, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type AdminUser = { id: string; email: string; full_name: string };
type Invoice = {
  id: string;
  user_id: string;
  amount: number;
  duration_days: number;
  status: "pending" | "submitted" | "verified" | "rejected";
  proof_image_path: string | null;
  proof_reference: string | null;
  notes: string;
  submitted_at: string | null;
  verified_at: string | null;
  created_at: string;
};

const STATUS_FILTERS = ["submitted", "pending", "verified", "rejected", "all"] as const;

export function BillingQueue() {
  const { logout } = useAuth();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("submitted");
  const queryClient = useQueryClient();
  const qrInputRef = useRef<HTMLInputElement>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["admin-invoices", statusFilter],
    queryFn: () => api.get<Invoice[]>(`/admin/invoices${statusFilter === "all" ? "" : `?status=${statusFilter}`}`),
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<AdminUser[]>("/admin/users"),
  });

  const { data: qrInfo } = useQuery({
    queryKey: ["admin-qr-code"],
    queryFn: () => api.get<{ qr_code_configured: boolean }>("/admin/settings/qr-code"),
  });

  const uploadQr = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api.put("/admin/settings/qr-code", form);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-qr-code"] }),
    onError: (err) => alert(err instanceof ApiError ? err.message : "QR upload failed."),
  });

  const verify = useMutation({
    mutationFn: (id: string) => api.post(`/admin/invoices/${id}/verify`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-invoices"] }),
    onError: (err) => alert(err instanceof ApiError ? err.message : "Verify failed."),
  });

  const reject = useMutation({
    mutationFn: (id: string) => api.post(`/admin/invoices/${id}/reject`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-invoices"] }),
    onError: (err) => alert(err instanceof ApiError ? err.message : "Reject failed."),
  });

  function userLabel(userId: string) {
    const u = users?.find((x) => x.id === userId);
    return u ? u.full_name || u.email : userId;
  }

  async function viewProof(invoiceId: string) {
    const res = await fetch(`${API_URL}/admin/invoices/${invoiceId}/proof-image`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) {
      alert("No proof image for this invoice.");
      return;
    }
    const blob = await res.blob();
    window.open(URL.createObjectURL(blob), "_blank");
  }

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <header className="flex items-center justify-between border-b border-ink-200 bg-white px-6 py-4 dark:border-ink-800 dark:bg-ink-900">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-ink-400 hover:text-ink-600">
            <ArrowLeft size={18} />
          </Link>
          <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Billing</p>
        </div>
        <button onClick={logout} className="text-xs font-medium text-ink-500 hover:text-red-500">
          Log Out
        </button>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        <section className="rounded-xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Payment QR Code</p>
              <p className="text-xs text-ink-500">
                Shown to every user on their invoice screen. {qrInfo?.qr_code_configured ? "Currently set." : "Not set yet."}
              </p>
            </div>
            <button
              onClick={() => qrInputRef.current?.click()}
              disabled={uploadQr.isPending}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-brand-500 px-3 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              <QrCode size={13} />
              {uploadQr.isPending ? "Uploading…" : qrInfo?.qr_code_configured ? "Replace QR" : "Upload QR"}
            </button>
            <input
              ref={qrInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadQr.mutate(file);
                e.target.value = "";
              }}
            />
          </div>
        </section>

        <div className="mt-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-100">Invoices</h1>
          <div className="flex gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-brand-500 text-white"
                    : "bg-white text-ink-600 hover:bg-ink-100 dark:bg-ink-900 dark:text-ink-400 dark:hover:bg-ink-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {isLoading && <p className="text-sm text-ink-400">Loading…</p>}
          {(invoices ?? []).map((inv) => (
            <div
              key={inv.id}
              className="flex flex-col gap-2 rounded-xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-900 dark:text-ink-100">{userLabel(inv.user_id)}</p>
                <p className="text-xs text-ink-500">
                  NPR {inv.amount.toLocaleString()} · {inv.duration_days} days
                  {inv.proof_reference ? ` · ref: ${inv.proof_reference}` : ""}
                </p>
                <p className="text-xs text-ink-400">
                  {inv.submitted_at ? `Submitted ${new Date(inv.submitted_at).toLocaleString()}` : `Created ${new Date(inv.created_at).toLocaleString()}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    inv.status === "verified"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : inv.status === "rejected"
                        ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                        : inv.status === "submitted"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          : "bg-ink-100 text-ink-500 dark:bg-ink-800"
                  }`}
                >
                  {inv.status}
                </span>
                {inv.proof_image_path && (
                  <button
                    onClick={() => viewProof(inv.id)}
                    className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    View proof
                  </button>
                )}
                {inv.status === "submitted" && (
                  <>
                    <button
                      onClick={() => verify.mutate(inv.id)}
                      disabled={verify.isPending}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      <Check size={12} /> Verify
                    </button>
                    <button
                      onClick={() => reject.mutate(inv.id)}
                      disabled={reject.isPending}
                      className="flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-ink-50 disabled:opacity-50 dark:border-ink-700 dark:text-ink-400 dark:hover:bg-ink-800"
                    >
                      <X size={12} /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {invoices?.length === 0 && <p className="text-sm text-ink-400">No invoices in this view.</p>}
        </div>
      </main>
    </div>
  );
}
