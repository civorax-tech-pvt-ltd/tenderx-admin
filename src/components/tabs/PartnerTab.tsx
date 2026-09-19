"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { FormCard } from "@/components/ui/FormCard";
import { TextField } from "@/components/ui/FormField";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { api } from "@/lib/api";
import { ATTACHMENT_CATEGORIES, CATEGORY_LABELS, PERCENTAGE_KEYS, roleFieldKey, roleImageKeys, type PartnerRole } from "@/lib/constants";
import { useDraftEditor, type AdminDraftOut } from "@/lib/draft-editor-context";

export function PartnerTab({ role }: { role: PartnerRole }) {
  const { userId, draftId } = useDraftEditor();
  const f = (suffix: string) => roleFieldKey(role, suffix);
  const imgKeys = roleImageKeys(role);
  const percentageKey = PERCENTAGE_KEYS[role];

  return (
    <div className="flex flex-col gap-4">
      <FormCard title="Organisation Details">
        <TextField fieldKey={f("PARTNER_NAME")} label="Partner Name" span={2} />
        <div className="sm:col-span-2">
          <ImageUpload imgKey={imgKeys.stamp} label="Stamp" />
        </div>
        <TextField fieldKey={f("PARTNER_SHORT")} label="Short Name" />
        <TextField fieldKey={f("ADDRESS")} label="Address" />
      </FormCard>

      <FormCard title="Authorised Persons">
        <TextField fieldKey={f("PARTNER_CEO")} label="CEO / Authorised Person" span={2} />
        <div className="sm:col-span-2">
          <ImageUpload imgKey={imgKeys.ceoSig} label="CEO Signature" />
        </div>
        <TextField fieldKey={f("PARTNER_MD1")} label="Managing Director 1" span={2} />
        <div className="sm:col-span-2">
          <ImageUpload imgKey={imgKeys.md1} label="MD1 Signature" />
        </div>
        <TextField fieldKey={f("PARTNER_MD2")} label="Managing Director 2" span={2} />
        <div className="sm:col-span-2">
          <ImageUpload imgKey={imgKeys.md2} label="MD2 Signature" />
        </div>
      </FormCard>

      <FormCard title="Ownership">
        <TextField fieldKey={percentageKey} label="Ownership Percentage" mono />
      </FormCard>

      <AttachmentsCard role={role} userId={userId} draftId={draftId} />
    </div>
  );
}

function AttachmentsCard({ role, userId, draftId }: { role: PartnerRole; userId: string; draftId: string }) {
  const { sessionDocs, loadDraft } = useDraftEditor();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const queryClient = useQueryClient();

  const upload = useMutation({
    mutationFn: ({ category, file }: { category: string; file: File }) => {
      const form = new FormData();
      form.append("role", role);
      form.append("category", category);
      form.append("file", file);
      return api.post<AdminDraftOut>(`/admin/users/${userId}/drafts/${draftId}/session-docs`, form);
    },
    onSuccess: (draft) => {
      loadDraft(draft);
      queryClient.invalidateQueries({ queryKey: ["admin-draft", userId, draftId] });
    },
  });

  const remove = useMutation({
    mutationFn: (docId: string) => api.del<AdminDraftOut>(`/admin/users/${userId}/drafts/${draftId}/session-docs/${docId}`),
    onSuccess: (draft) => {
      loadDraft(draft);
      queryClient.invalidateQueries({ queryKey: ["admin-draft", userId, draftId] });
    },
  });

  const docsForRole = sessionDocs.filter((d) => d.role === role);

  return (
    <section className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-5">
      <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">Supporting Documents</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ATTACHMENT_CATEGORIES.map((category) => {
          const docs = docsForRole.filter((d) => d.category === category);
          return (
            <div key={category} className="rounded-lg border border-ink-100 p-3 dark:border-ink-800">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-ink-700 dark:text-ink-300">{CATEGORY_LABELS[category]}</p>
                <button
                  type="button"
                  onClick={() => inputRefs.current[category]?.click()}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  Upload
                </button>
                <input
                  ref={(el) => {
                    inputRefs.current[category] = el;
                  }}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload.mutate({ category, file });
                    e.target.value = "";
                  }}
                />
              </div>
              <ul className="mt-2 space-y-1">
                {docs.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between text-xs text-ink-500">
                    <span className="truncate">{doc.original_filename}</span>
                    <button onClick={() => remove.mutate(doc.id)} className="text-red-500 hover:text-red-600">
                      Remove
                    </button>
                  </li>
                ))}
                {docs.length === 0 && <li className="text-xs text-ink-400">No files yet.</li>}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
