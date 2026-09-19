"use client";

import { Upload, Check } from "lucide-react";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { useDraftEditor, type AdminDraftOut } from "@/lib/draft-editor-context";

export function ImageUpload({ imgKey, label }: { imgKey: string; label: string }) {
  const { userId, draftId, images, setImage } = useDraftEditor();
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasImage = Boolean(images[imgKey]);

  async function handleFile(file: File) {
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const draft = await api.put<AdminDraftOut>(`/admin/users/${userId}/drafts/${draftId}/images/${imgKey}`, form);
      const updated = draft.images.find((i) => i.img_key === imgKey);
      if (updated) setImage(imgKey, updated.storage_path);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${
          hasImage
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
            : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-400"
        }`}
      >
        {hasImage ? <Check size={13} /> : <Upload size={13} />}
        {isUploading ? "Uploading…" : hasImage ? `${label} uploaded` : `Upload ${label}`}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
