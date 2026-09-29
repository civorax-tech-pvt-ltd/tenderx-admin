"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, FileText, KeyRound, Shield, Users, X, ChevronRight, Clock, Activity } from "lucide-react";
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

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-ink-900 dark:text-ink-100">{value}</p>
      <p className="text-xs font-medium text-ink-500">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-400">{sub}</p>}
    </div>
  );
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

  const totalUsers = users?.length ?? 0;
  const verifiedUsers = users?.filter((u) => u.email_verified).length ?? 0;
  const totalGenerated = users?.reduce((s, u) => s + u.generation_count, 0) ?? 0;
  const expiredTrials = users?.filter((u) => u.trial_expired).length ?? 0;

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/80 backdrop-blur dark:border-ink-800 dark:bg-ink-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
              TX
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-ink-900 dark:text-ink-100">TenderX Admin</p>
              <p className="text-[11px] leading-tight text-ink-400">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/billing"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
            >
              Billing
            </Link>
            <button
              onClick={logout}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-ink-100">Users</h1>
          <p className="mt-0.5 text-sm text-ink-500">Verify accounts, manage trial periods, and act on user data.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={<Users size={18} />} label="Total Users" value={totalUsers} />
          <StatCard icon={<Check size={18} />} label="Verified" value={verifiedUsers} sub={`${totalUsers - verifiedUsers} unverified`} />
          <StatCard icon={<Activity size={18} />} label="Docs Generated" value={totalGenerated} />
          <StatCard icon={<Clock size={18} />} label="Expired Trials" value={expiredTrials} />
        </div>

        {/* Users table */}
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900">
          <div className="border-b border-ink-100 px-5 py-3.5 dark:border-ink-800">
            <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">All Users</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800">
                  <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">User</th>
                  <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Status</th>
                  <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Trial Ends</th>
                  <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Docs</th>
                  <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Permissions</th>
                  <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Role</th>
                  <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-ink-400">
                      Loading users…
                    </td>
                  </tr>
                )}
                {(users ?? []).map((u) => (
                  <tr
                    key={u.id}
                    className={`group transition-colors hover:bg-ink-50/60 dark:hover:bg-ink-800/40 ${
                      selectedUserId === u.id ? "bg-brand-50/40 dark:bg-brand-500/5" : ""
                    }`}
                  >
                    {/* User */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setSelectedUserId(u.id)}
                        className="flex items-center gap-2.5 text-left"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                          {(u.full_name || u.email).charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <span className="block font-medium text-ink-900 group-hover:text-brand-600 dark:text-ink-100 dark:group-hover:text-brand-400">
                            {u.full_name || u.email}
                          </span>
                          <span className="block text-xs text-ink-400">{u.email}</span>
                        </span>
                      </button>
                    </td>

                    {/* Verified */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => updateUser.mutate({ id: u.id, payload: { email_verified: !u.email_verified } })}
                        title="Click to toggle"
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          u.email_verified
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400"
                        }`}
                      >
                        {u.email_verified ? <Check size={11} /> : <X size={11} />}
                        {u.email_verified ? "Verified" : "Unverified"}
                      </button>
                    </td>

                    {/* Trial */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
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
                          className="rounded-md bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400"
                        >
                          +30d
                        </button>
                      </div>
                    </td>

                    {/* Docs */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setSelectedUserId(u.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300"
                      >
                        <FileText size={12} />
                        {u.generation_count}
                      </button>
                    </td>

                    {/* Permissions */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        <PermissionChip
                          label="1st Partner"
                          checked={u.can_use_first_partner}
                          onToggle={() => updateUser.mutate({ id: u.id, payload: { can_use_first_partner: !u.can_use_first_partner } })}
                        />
                        <PermissionChip
                          label="2nd Partner"
                          checked={u.can_use_second_partner}
                          onToggle={() => updateUser.mutate({ id: u.id, payload: { can_use_second_partner: !u.can_use_second_partner } })}
                        />
                        <PermissionChip
                          label="Sig/Stamp"
                          checked={u.can_upload_signature_stamp}
                          onToggle={() => updateUser.mutate({ id: u.id, payload: { can_upload_signature_stamp: !u.can_upload_signature_stamp } })}
                        />
                      </div>
                    </td>

                    {/* Admin toggle */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => updateUser.mutate({ id: u.id, payload: { is_admin: !u.is_admin } })}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          u.is_admin
                            ? "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400"
                            : "bg-ink-100 text-ink-500 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-400"
                        }`}
                      >
                        <Shield size={11} />
                        {u.is_admin ? "Admin" : "User"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedUserId(u.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-brand-600"
                        >
                          View <ChevronRight size={11} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Reset the password for ${u.email}?`)) resetPassword.mutate(u.id);
                          }}
                          disabled={resetPassword.isPending}
                          title="Reset password"
                          className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1 text-[11px] font-semibold text-ink-500 hover:border-ink-300 hover:text-ink-700 disabled:opacity-50 dark:border-ink-700 dark:hover:text-ink-200"
                        >
                          <KeyRound size={11} /> Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{children}</p>;
}

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

  const initials = (user.full_name || user.email).charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-ink-200 bg-white shadow-2xl dark:border-ink-800 dark:bg-ink-900"
      >
        {/* Panel header */}
        <div className="sticky top-0 z-10 border-b border-ink-100 bg-white px-5 py-4 dark:border-ink-800 dark:bg-ink-900">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink-900 dark:text-ink-100">{user.full_name || user.email}</p>
              <p className="truncate text-xs text-ink-400">{user.email}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-5">
          {/* Drafts */}
          <section>
            <SectionLabel>Drafts ({drafts?.length ?? 0})</SectionLabel>
            <ul className="space-y-2">
              {(drafts ?? []).map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-xl border border-ink-100 px-3.5 py-2.5 dark:border-ink-800">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-200">{d.name}</p>
                    <p className="text-[11px] text-ink-400">{new Date(d.updated_at).toLocaleString()}</p>
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
          </section>

          {/* Subscription */}
          <section>
            <SectionLabel>Subscription</SectionLabel>
            <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
              <div className="flex gap-3">
                <label className="flex-1">
                  <span className="mb-1 block text-xs text-ink-500">Price (NPR)</span>
                  <input
                    type="number"
                    defaultValue={user.subscription_amount ?? ""}
                    onBlur={(e) => {
                      const value = e.target.value ? Number(e.target.value) : null;
                      updateSubscription.mutate({ subscription_amount: value });
                    }}
                    className="h-8 w-full rounded-lg border border-ink-200 bg-white px-2.5 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100"
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
                    className="h-8 w-full rounded-lg border border-ink-200 bg-white px-2.5 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100"
                  />
                </label>
              </div>
              <button
                onClick={() => createInvoice.mutate()}
                disabled={createInvoice.isPending}
                className="mt-3 h-8 w-full rounded-lg bg-brand-500 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {createInvoice.isPending ? "Creating…" : "Create Invoice"}
              </button>
            </div>
          </section>

          {/* Payment history */}
          <section>
            <SectionLabel>Payment History</SectionLabel>
            <ul className="space-y-1.5">
              {(invoices ?? []).map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-2 rounded-xl border border-ink-100 px-3.5 py-2.5 text-xs dark:border-ink-800">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-700 dark:text-ink-300">
                      NPR {inv.amount.toLocaleString()} · {inv.duration_days}d
                    </p>
                    <p className="text-[11px] text-ink-400">{new Date(inv.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
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
                        className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </li>
              ))}
              {invoices?.length === 0 && <li className="text-xs text-ink-400">No invoices yet.</li>}
            </ul>
          </section>

          {/* Generation history */}
          <section>
            <SectionLabel>Generation History {history ? `(${history.total})` : ""}</SectionLabel>
            <ul className="space-y-1.5">
              {(history?.items ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-ink-100 px-3.5 py-2.5 dark:border-ink-800">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-ink-700 dark:text-ink-300">{item.jv_name || item.filename}</p>
                    <p className="text-[11px] text-ink-400">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => downloadFile(item.download_url, item.filename)}
                    className="shrink-0 rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                  >
                    <Download size={14} />
                  </button>
                </li>
              ))}
              {history?.items.length === 0 && <li className="text-xs text-ink-400">No documents generated yet.</li>}
            </ul>
          </section>

          {/* Partner profiles */}
          <section>
            <SectionLabel>Saved Partner Profiles ({profiles?.length ?? 0})</SectionLabel>
            <ul className="space-y-1">
              {(profiles ?? []).map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-xl border border-ink-100 px-3.5 py-2 dark:border-ink-800">
                  <p className="text-sm font-medium text-ink-700 dark:text-ink-300">{p.name}</p>
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] text-ink-500 dark:bg-ink-800">{p.partner_name}</span>
                </li>
              ))}
              {profiles?.length === 0 && <li className="text-xs text-ink-400">No saved profiles yet.</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function PermissionChip({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title="Click to toggle"
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors ${
        checked
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-ink-100 text-ink-500 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-400"
      }`}
    >
      {checked ? <Check size={10} /> : <X size={10} />}
      {label}
    </button>
  );
}
