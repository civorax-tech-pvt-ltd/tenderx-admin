"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState } from "react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({ message: "" });
  const resolveRef = useRef<(v: boolean) => void>(() => {});

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setOpts(options);
    setOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => { setOpen(false); resolveRef.current(true); };
  const handleCancel = () => { setOpen(false); resolveRef.current(false); };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCancel} />
          <div className="relative w-full max-w-sm rounded-2xl border border-ink-200 bg-white shadow-2xl dark:border-ink-800 dark:bg-ink-900">
            <div className="flex items-start gap-3 p-5">
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                opts.variant === "danger"
                  ? "bg-red-50 text-red-500 dark:bg-red-500/10"
                  : "bg-amber-50 text-amber-500 dark:bg-amber-500/10"
              }`}>
                {opts.variant === "danger" ? <Trash2 size={17} /> : <AlertTriangle size={17} />}
              </span>
              <div className="min-w-0 flex-1">
                {opts.title && (
                  <h3 className="text-[15px] font-semibold text-ink-900 dark:text-ink-100">{opts.title}</h3>
                )}
                <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{opts.message}</p>
              </div>
              <button
                onClick={handleCancel}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex justify-end gap-2 border-t border-ink-100 px-5 py-3 dark:border-ink-800">
              <button
                onClick={handleCancel}
                className="rounded-lg border border-ink-200 px-3.5 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
              >
                {opts.cancelLabel ?? "Cancel"}
              </button>
              <button
                onClick={handleConfirm}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white ${
                  opts.variant === "danger"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                {opts.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmDialogProvider");
  return ctx.confirm;
}
