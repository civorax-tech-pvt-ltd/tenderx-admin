"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, QrCode, X, CreditCard, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

function QrPreview() {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    fetch(`${API_URL}/admin/settings/qr-code/image`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((blob) => setSrc(URL.createObjectURL(blob)))
      .catch(() => {});
  }, []);

  if (!src) return <div className="h-36 w-36 animate-pulse rounded-lg bg-ink-100 dark:bg-ink-800" />;
  return (
    <img
      src={src}
      alt="Payment QR Code"
      className="h-36 w-36 rounded-lg border border-ink-200 object-contain dark:border-ink-700"
    />
  );
}

const STATUS_FILTERS = ["submitted", "pending", "verified", "rejected", "all"] as const;

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  verified:  { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", icon: <CheckCircle2 size={11} /> },
  rejected:  { bg: "bg-red-50 dark:bg-red-500/10",         text: "text-red-600 dark:text-red-400",         icon: <XCircle size={11} /> },
  submitted: { bg: "bg-amber-50 dark:bg-amber-500/10",     text: "text-amber-700 dark:text-amber-400",     icon: <Clock size={11} /> },
  pending:   { bg: "bg-ink-100 dark:bg-ink-800",           text: "text-ink-500 dark:text-ink-400",         icon: <CreditCard size={11} /> },
};

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

  function userInitial(userId: string) {
    const label = userLabel(userId);
    return label.charAt(0).toUpperCase();
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

  const submittedCount = invoices?.filter((i) => i.status === "submitted").length ?? 0;

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/80 backdrop-blur dark:border-ink-800 dark:bg-ink-900/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Billing</p>
              <p className="text-[11px] text-ink-400">Manage invoices and payment verification</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-6">
        {/* QR Code card */}
        <div className="rounded-xl border border-ink-200 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <QrCode size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Payment QR Code</p>
                <p className="text-xs text-ink-400">
                  {qrInfo?.qr_code_configured ? "Currently set — shown on every user invoice screen." : "Not configured yet."}
                </p>
              </div>
            </div>
            <button
              onClick={() => qrInputRef.current?.click()}
              disabled={uploadQr.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              <QrCode size={13} />
              {uploadQr.isPending ? "Uploading…" : qrInfo?.qr_code_configured ? "Replace QR" : "Upload QR"}
            </button>
          </div>
          {qrInfo?.qr_code_configured && (
            <div className="border-t border-ink-100 px-5 py-4 dark:border-ink-800">
              <QrPreview />
            </div>
          )}
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

        {/* Invoices header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-ink-900 dark:text-ink-100">
              Invoices
              {statusFilter === "submitted" && submittedCount > 0 && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                  {submittedCount} pending review
                </span>
              )}
            </h1>
          </div>
          <div className="flex gap-1 rounded-xl border border-ink-200 bg-white p-1 shadow-sm dark:border-ink-800 dark:bg-ink-900">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice list */}
        <div className="space-y-3">
          {isLoading && (
            <div className="py-10 text-center text-sm text-ink-400">Loading invoices…</div>
          )}
          {(invoices ?? []).map((inv) => {
            const style = STATUS_STYLES[inv.status] ?? STATUS_STYLES.pending;
            return (
              <div
                key={inv.id}
                className="flex flex-col gap-4 rounded-xl border border-ink-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-ink-800 dark:bg-ink-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                    {userInitial(inv.user_id)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900 dark:text-ink-100">{userLabel(inv.user_id)}</p>
                    <p className="text-xs text-ink-500">
                      NPR {inv.amount.toLocaleString()} · {inv.duration_days} days
                      {inv.proof_reference ? <span className="text-ink-400"> · ref: {inv.proof_reference}</span> : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-400">
                      {inv.submitted_at
                        ? `Submitted ${new Date(inv.submitted_at).toLocaleString()}`
                        : `Created ${new Date(inv.created_at).toLocaleString()}`}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.bg} ${style.text}`}>
                    {style.icon}
                    {inv.status}
                  </span>
                  {inv.proof_image_path && (
                    <button
                      onClick={() => viewProof(inv.id)}
                      className="rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-semibold text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-400 dark:hover:bg-ink-800"
                    >
                      View proof
                    </button>
                  )}
                  {inv.status === "submitted" && (
                    <>
                      <button
                        onClick={() => verify.mutate(inv.id)}
                        disabled={verify.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <Check size={12} /> Verify
                      </button>
                      <button
                        onClick={() => reject.mutate(inv.id)}
                        disabled={reject.isPending}
                        className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <X size={12} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {!isLoading && invoices?.length === 0 && (
            <div className="rounded-xl border border-dashed border-ink-200 py-12 text-center dark:border-ink-800">
              <p className="text-sm text-ink-400">No invoices in this view.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
