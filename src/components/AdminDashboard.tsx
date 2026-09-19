"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, FileText, KeyRound, Shield, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { api, ApiError, API_URL, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  email_verified: boolean;
  trial_ends_at: string;
  trial_expired: boolean;
  created_at: string;
  generation_count: number;
  can_use_first_partner: boolean;
  can_use_second_partner: boolean;
  can_upload_signature_stamp: boolean;
  subscription_amount: number | null;
  subscription_duration_days: number | null;
};

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<AdminUser[]>("/admin/users"),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      api.put(`/admin/users/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const resetPassword = useMutation({
    mutationFn: (id: string) => api.post<{ new_password: string }>(`/admin/users/${id}/reset-password`, {}),
    onSuccess: (result, id) => {
      const email = users?.find((u) => u.id === id)?.email ?? "";
      alert(`New password for ${email}:\n\n${result.new_password}\n\nThis was also emailed to them (or logged, if SMTP isn't configured). Copy it now — it won't be shown again.`);
    },
    onError: (err) => alert(err instanceof ApiError ? err.message : "Password reset failed."),
  });

  const selectedUser = users?.find((u) => u.id === selectedUserId) ?? null;

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <header className="flex items-center justify-between border-b border-ink-200 bg-white px-6 py-4 dark:border-ink-800 dark:bg-ink-900">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            TX
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-ink-900 dark:text-ink-100">Admin Dashboard</p>
            <p className="text-xs leading-tight text-ink-500">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/billing" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Billing
          </Link>
          <button onClick={logout} className="text-xs font-medium text-ink-500 hover:text-red-500">
            Log Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-100">Users</h1>
        <p className="mt-1 text-sm text-ink-500">Verify accounts, manage trial periods, and act on a user's data.</p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400 dark:border-ink-800">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Trial ends</th>
                <th className="px-4 py-3 font-medium">Generated</th>
                <th className="px-4 py-3 font-medium">Partner Access</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-400">
                    Loading…
                  </td>
                </tr>
              )}
              {(users ?? []).map((u) => (
                <tr key={u.id} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedUserId(u.id)}
                      className="text-left font-medium text-ink-900 hover:text-brand-600 dark:text-ink-100 dark:hover:text-brand-400"
                    >
                      {u.full_name || u.email}
                    </button>
                    <p className="text-xs text-ink-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => updateUser.mutate({ id: u.id, payload: { email_verified: !u.email_verified } })}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                        u.email_verified
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400"
                      }`}
                      title="Click to toggle"
                    >
                      {u.email_verified ? <Check size={12} /> : <X size={12} />}
                      {u.email_verified ? "Verified" : "Unverified"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        defaultValue={toDateInputValue(u.trial_ends_at)}
                        onBlur={(e) => {
                          if (!e.target.value) return;
                          updateUser.mutate({ id: u.id, payload: { trial_ends_at: `${e.target.value}T00:00:00` } });
                        }}
                        className={`h-7 rounded-md border px-1.5 text-xs outline-none focus:border-brand-500 ${
                          u.trial_expired
                            ? "border-red-300 text-red-500 dark:border-red-800"
                            : "border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300"
                        } bg-white dark:bg-ink-950`}
                      />
                      <button
                        onClick={() => updateUser.mutate({ id: u.id, payload: { extend_trial_days: 30 } })}
                        className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                      >
                        +30d
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedUserId(u.id)}
                      className="inline-flex items-center gap-1 text-ink-600 hover:text-brand-600 dark:text-ink-300 dark:hover:text-brand-400"
                    >
                      <FileText size={13} /> {u.generation_count}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <PermissionChip
                        label="1st Partner"
                        checked={u.can_use_first_partner}
                        onToggle={() =>
                          updateUser.mutate({ id: u.id, payload: { can_use_first_partner: !u.can_use_first_partner } })
                        }
                      />
                      <PermissionChip
                        label="2nd Partner"
                        checked={u.can_use_second_partner}
                        onToggle={() =>
                          updateUser.mutate({ id: u.id, payload: { can_use_second_partner: !u.can_use_second_partner } })
                        }
                      />
                      <PermissionChip
                        label="Sig/Stamp"
                        checked={u.can_upload_signature_stamp}
                        onToggle={() =>
                          updateUser.mutate({
                            id: u.id,
                            payload: { can_upload_signature_stamp: !u.can_upload_signature_stamp },
                          })
                        }
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => updateUser.mutate({ id: u.id, payload: { is_admin: !u.is_admin } })}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.is_admin
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                          : "bg-ink-100 text-ink-500 dark:bg-ink-800"
                      }`}
                    >
                      <Shield size={12} /> {u.is_admin ? "Admin" : "User"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedUserId(u.id)}
                        className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                      >
                        View data
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Reset the password for ${u.email}? A new password will be generated.`)) {
                            resetPassword.mutate(u.id);
                          }
                        }}
                        disabled={resetPassword.isPending}
                        className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-700 disabled:opacity-50 dark:text-ink-400 dark:hover:text-ink-200"
                        title="Reset password"
                      >
                        <KeyRound size={12} /> Reset
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {selectedUser && <UserDataPanel user={selectedUser} onClose={() => setSelectedUserId(null)} />}
    </div>
  );
}

type AdminDraftSummary = { id: string; name: string; updated_at: string };
type AdminProfileSummary = { id: string; name: string; role: string; partner_name: string };
type AdminGeneratedDocument = {
  id: string;
  doc_id: string;
  filename: string;
  jv_name: string;
  partner_count: number;
  created_at: string;
  download_url: string;
};

type AdminInvoice = {
  id: string;
  amount: number;
  duration_days: number;
  status: "pending" | "submitted" | "verified" | "rejected";
  proof_reference: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  created_at: string;
};

function UserDataPanel({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: drafts } = useQuery({
    queryKey: ["admin-user-drafts", user.id],
    queryFn: () => api.get<AdminDraftSummary[]>(`/admin/users/${user.id}/drafts`),
  });
  const { data: profiles } = useQuery({
    queryKey: ["admin-user-profiles", user.id],
    queryFn: () => api.get<AdminProfileSummary[]>(`/admin/users/${user.id}/profiles`),
  });
  const { data: history } = useQuery({
    queryKey: ["admin-user-history", user.id],
    queryFn: () => api.get<{ total: number; items: AdminGeneratedDocument[] }>(`/admin/users/${user.id}/generation-history`),
  });
  const { data: invoices } = useQuery({
    queryKey: ["admin-user-invoices", user.id],
    queryFn: () => api.get<AdminInvoice[]>(`/admin/users/${user.id}/invoices`),
  });

  const updateSubscription = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.put(`/admin/users/${user.id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const createInvoice = useMutation({
    mutationFn: () => {
      if (!user.subscription_amount || !user.subscription_duration_days) {
        throw new Error("Set a price and duration first.");
      }
      return api.post(`/admin/users/${user.id}/invoices`, {
        amount: user.subscription_amount,
        duration_days: user.subscription_duration_days,
        status: "pending",
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-user-invoices", user.id] }),
    onError: (err) => alert(err instanceof Error ? err.message : "Failed to create invoice."),
  });

  const verifyInvoice = useMutation({
    mutationFn: (id: string) => api.post(`/admin/invoices/${id}/verify`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-invoices", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => alert(err instanceof ApiError ? err.message : "Verify failed."),
  });

  const generate = useMutation({
    mutationFn: async (draftId: string) => {
      const { download_url, filename } = await api.post<{ download_url: string; filename: string }>(
        `/admin/users/${user.id}/generate`,
        { draft_id: draftId }
      );
      await downloadFile(download_url, filename);
    },
    onError: (err) => alert(err instanceof ApiError ? err.message : "Generation failed."),
  });

  async function downloadFile(path: string, filename: string) {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error("Download failed.");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900 dark:text-ink-100">{user.full_name || user.email}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-ink-500">{user.email}</p>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Drafts</p>
          <ul className="mt-2 space-y-2">
            {(drafts ?? []).map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2 dark:border-ink-800">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-200">{d.name}</p>
                  <p className="text-xs text-ink-400">{new Date(d.updated_at).toLocaleString()}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Link
                    href={`/users/${user.id}/drafts/${d.id}`}
                    className="rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-400 dark:hover:bg-ink-800"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => generate.mutate(d.id)}
                    disabled={generate.isPending}
                    className="flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    <Download size={12} /> Generate
                  </button>
                </div>
              </li>
            ))}
            {drafts?.length === 0 && <li className="text-xs text-ink-400">No drafts yet.</li>}
          </ul>
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Subscription</p>
          <div className="mt-2 flex gap-2">
            <label className="flex-1">
              <span className="mb-1 block text-xs text-ink-500">Price (NPR)</span>
              <input
                type="number"
                defaultValue={user.subscription_amount ?? ""}
                onBlur={(e) => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  updateSubscription.mutate({ subscription_amount: value });
                }}
                className="h-8 w-full rounded-lg border border-ink-200 bg-white px-2 text-xs outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100"
              />
            </label>
            <label className="flex-1">
              <span className="mb-1 block text-xs text-ink-500">Duration (days)</span>
              <input
                type="number"
                defaultValue={user.subscription_duration_days ?? ""}
                onBlur={(e) => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  updateSubscription.mutate({ subscription_duration_days: value });
                }}
                className="h-8 w-full rounded-lg border border-ink-200 bg-white px-2 text-xs outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100"
              />
            </label>
          </div>
          <button
            onClick={() => createInvoice.mutate()}
            disabled={createInvoice.isPending}
            className="mt-2 h-8 w-full rounded-lg border border-ink-200 text-xs font-medium text-ink-600 hover:bg-ink-50 disabled:opacity-50 dark:border-ink-700 dark:text-ink-400 dark:hover:bg-ink-800"
          >
            {createInvoice.isPending ? "Creating…" : "Create Invoice Now"}
          </button>

          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Payment History</p>
          <ul className="mt-2 space-y-1.5">
            {(invoices ?? []).map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-2 rounded-lg border border-ink-100 px-2.5 py-1.5 text-xs dark:border-ink-800">
                <div className="min-w-0">
                  <p className="font-medium text-ink-700 dark:text-ink-300">
                    NPR {inv.amount.toLocaleString()} · {inv.duration_days}d
                  </p>
                  <p className="text-ink-400">{new Date(inv.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={`rounded-full px-1.5 py-0.5 ${
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
                  {inv.status === "submitted" && (
                    <button
                      onClick={() => verifyInvoice.mutate(inv.id)}
                      className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </li>
            ))}
            {invoices?.length === 0 && <li className="text-xs text-ink-400">No invoices yet.</li>}
          </ul>
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            Generation History {history ? `(${history.total})` : ""}
          </p>
          <ul className="mt-2 space-y-1.5">
            {(history?.items ?? []).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-700 dark:text-ink-300">{item.jv_name || item.filename}</p>
                  <p className="text-ink-400">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => downloadFile(item.download_url, item.filename)}
                  className="shrink-0 text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  <Download size={13} />
                </button>
              </li>
            ))}
            {history?.items.length === 0 && <li className="text-xs text-ink-400">No documents generated yet.</li>}
          </ul>
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Partner Profiles</p>
          <ul className="mt-2 space-y-1">
            {(profiles ?? []).map((p) => (
              <li key={p.id} className="text-sm text-ink-700 dark:text-ink-300">
                {p.name} <span className="text-xs text-ink-400">({p.partner_name})</span>
              </li>
            ))}
            {profiles?.length === 0 && <li className="text-xs text-ink-400">No saved profiles yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PermissionChip({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
        checked
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-ink-100 text-ink-500 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-400"
      }`}
      title="Click to toggle"
    >
      {checked ? <Check size={10} /> : <X size={10} />}
      {label}
    </button>
  );
}
