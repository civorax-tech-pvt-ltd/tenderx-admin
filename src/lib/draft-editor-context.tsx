"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type FieldData = Record<string, string>;

export type AdminDraftOut = {
  id: string;
  name: string;
  field_data: FieldData;
  images: { img_key: string; storage_path: string }[];
  session_docs: { id: string; role: string; category: string; original_filename: string }[];
};

type DraftEditorContextValue = {
  userId: string;
  draftId: string;
  fieldData: FieldData;
  images: Record<string, string>;
  sessionDocs: AdminDraftOut["session_docs"];
  setField: (key: string, value: string) => void;
  setImage: (imgKey: string, storagePath: string) => void;
  loadDraft: (draft: AdminDraftOut) => void;
};

const DraftEditorContext = createContext<DraftEditorContextValue | null>(null);

export function DraftEditorProvider({
  userId,
  draftId,
  children,
}: {
  userId: string;
  draftId: string;
  children: React.ReactNode;
}) {
  const [fieldData, setFieldData] = useState<FieldData>({});
  const [images, setImages] = useState<Record<string, string>>({});
  const [sessionDocs, setSessionDocs] = useState<AdminDraftOut["session_docs"]>([]);

  const setField = useCallback((key: string, value: string) => {
    setFieldData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setImage = useCallback((imgKey: string, storagePath: string) => {
    setImages((prev) => ({ ...prev, [imgKey]: storagePath }));
  }, []);

  const loadDraft = useCallback((draft: AdminDraftOut) => {
    setFieldData(draft.field_data);
    const imgMap: Record<string, string> = {};
    for (const img of draft.images) imgMap[img.img_key] = img.storage_path;
    setImages(imgMap);
    setSessionDocs(draft.session_docs);
  }, []);

  const value = useMemo(
    () => ({ userId, draftId, fieldData, images, sessionDocs, setField, setImage, loadDraft }),
    [userId, draftId, fieldData, images, sessionDocs, setField, setImage, loadDraft]
  );

  return <DraftEditorContext.Provider value={value}>{children}</DraftEditorContext.Provider>;
}

export function useDraftEditor() {
  const ctx = useContext(DraftEditorContext);
  if (!ctx) throw new Error("useDraftEditor must be used within DraftEditorProvider");
  return ctx;
}
