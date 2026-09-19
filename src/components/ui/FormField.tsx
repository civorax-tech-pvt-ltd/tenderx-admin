"use client";

import { useDraftEditor } from "@/lib/draft-editor-context";

export function TextField({
  fieldKey,
  label,
  span = 1,
  type = "text",
  mono = false,
}: {
  fieldKey: string;
  label: string;
  span?: 1 | 2;
  type?: string;
  mono?: boolean;
}) {
  const { fieldData, setField } = useDraftEditor();

  return (
    <label className={span === 2 ? "sm:col-span-2" : undefined}>
      <span className="mb-1.5 block text-xs font-medium text-ink-600 dark:text-ink-400">{label}</span>
      <input
        type={type}
        value={fieldData[fieldKey] ?? ""}
        onChange={(e) => setField(fieldKey, e.target.value)}
        className={`h-9 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100 ${
          mono ? "font-mono tabular-nums" : ""
        }`}
      />
    </label>
  );
}

export function SelectField({
  fieldKey,
  label,
  options,
  span = 1,
}: {
  fieldKey: string;
  label: string;
  options: { value: string; label: string }[];
  span?: 1 | 2;
}) {
  const { fieldData, setField } = useDraftEditor();

  return (
    <label className={span === 2 ? "sm:col-span-2" : undefined}>
      <span className="mb-1.5 block text-xs font-medium text-ink-600 dark:text-ink-400">{label}</span>
      <select
        value={fieldData[fieldKey] ?? ""}
        onChange={(e) => setField(fieldKey, e.target.value)}
        className="h-9 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100"
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
