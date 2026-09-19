"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, FileOutput, LayoutGrid, Save, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { ProjectTab } from "@/components/tabs/ProjectTab";
import { PartnerTab } from "@/components/tabs/PartnerTab";
import { api, ApiError, API_URL, getToken } from "@/lib/api";
import { DraftEditorProvider, useDraftEditor, type AdminDraftOut } from "@/lib/draft-editor-context";
import { determinePartnerCount } from "@/lib/validation";

type TabKey = "project" | "lead" | "first" | "second";

const TABS: { key: TabKey; label: string; icon: typeof LayoutGrid }[] = [
  { key: "project", label: "Project Info", icon: LayoutGrid },
  { key: "lead", label: "Lead Partner", icon: Users },
  { key: "first", label: "First Partner", icon: Users },
  { key: "second", label: "Second Partner", icon: Users },
];

export default function DraftEditorPage() {
  const params = useParams<{ userId: string; draftId: string }>();

  return (
    <AdminGuard>
      <DraftEditorProvider userId={params.userId} draftId={params.draftId}>
        <DraftEditorShell />
      </DraftEditorProvider>
    </AdminGuard>
  );
}

async function downloadBlob(path: string, filename: string, method: "GET" | "POST" = "GET") {
  const res = await fetch(`${API_URL}${path}`, {
    method,
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

function DraftEditorShell() {
  const { userId, draftId, fieldData, loadDraft } = useDraftEditor();
  const [activeTab, setActiveTab] = useState<TabKey>("project");
  const [lastGeneratedDocId, setLastGeneratedDocId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-draft", userId, draftId],
    queryFn: () => api.get<AdminDraftOut>(`/admin/users/${userId}/drafts/${draftId}`),
  });

  useEffect(() => {
    if (data) loadDraft(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.put<AdminDraftOut>(`/admin/users/${userId}/drafts/${draftId}`, { field_data: fieldData }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-draft", userId, draftId] }),
  });

  const generate = useMutation({
    mutationFn: async () => {
      await save.mutateAsync();
      const { id, download_url, filename } = await api.post<{ id: string; download_url: string; filename: string }>(
        `/admin/users/${userId}/generate`,
        { draft_id: draftId }
      );
      await downloadBlob(download_url, filename);
      return id;
    },
    onSuccess: (id) => setLastGeneratedDocId(id),
    onError: (err) => alert(err instanceof ApiError ? err.message : "Generation failed."),
  });

  const generatePdfs = useMutation({
    mutationFn: async () => {
      if (!lastGeneratedDocId) throw new Error("Generate the bid document first.");
      const partnerCount = determinePartnerCount(fieldData);
      await downloadBlob(
        `/admin/users/${userId}/generate/${lastGeneratedDocId}/pdf?partner_count=${partnerCount}`,
        `${lastGeneratedDocId}_sections.zip`,
        "POST"
      );
    },
    onError: (err) => alert(err instanceof ApiError ? err.message : "PDF split failed."),
  });

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <p className="text-sm text-ink-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <header className="flex items-center justify-between border-b border-ink-200 bg-white px-6 py-4 dark:border-ink-800 dark:bg-ink-900">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-ink-400 hover:text-ink-600">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{data.name}</p>
            <p className="text-xs text-ink-500">Editing on behalf of the client</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-ink-200 px-3 text-xs font-medium text-ink-600 hover:bg-ink-50 disabled:opacity-50 dark:border-ink-700 dark:text-ink-400 dark:hover:bg-ink-800"
          >
            <Save size={13} />
            {save.isPending ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => generatePdfs.mutate()}
            disabled={!lastGeneratedDocId || generatePdfs.isPending}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-ink-200 px-3 text-xs font-medium text-ink-600 hover:bg-ink-50 disabled:opacity-40 dark:border-ink-700 dark:text-ink-400 dark:hover:bg-ink-800"
          >
            <FileOutput size={13} />
            {generatePdfs.isPending ? "Splitting…" : "Generate PDFs"}
          </button>
          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            <Download size={13} />
            {generate.isPending ? "Generating…" : "Save & Generate"}
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl gap-6 p-6">
        <nav className="w-48 shrink-0 space-y-0.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                  : "text-ink-600 hover:bg-ink-50 dark:text-ink-400 dark:hover:bg-ink-800"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <main className="min-w-0 flex-1">
          {activeTab === "project" && <ProjectTab />}
          {activeTab === "lead" && <PartnerTab role="lead" />}
          {activeTab === "first" && <PartnerTab role="first" />}
          {activeTab === "second" && <PartnerTab role="second" />}
        </main>
      </div>
    </div>
  );
}
