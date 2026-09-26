"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cx } from "/components/ui";

export type Toast = { id: number; tone: "info" | "success" | "error"; text: string };

export function Toasts({ items, onDismiss }: { items: Toast[]; onDismiss: (id: number) => void }) {
  if (!items.length) return null;
  const icons = {
    info: <Info size={16} className="text-gold-400" />,
    success: <CheckCircle2 size={16} className="text-win" />,
    error: <AlertTriangle size={16} className="text-loss" />,
  };
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cx(
            "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md animate-toast-in",
            t.tone === "error"
              ? "border-loss/30 bg-loss-deep/80 text-fg"
              : t.tone === "success"
                ? "border-win/30 bg-win-deep/80 text-fg"
                : "border-gold-500/30 bg-ink-800/90 text-fg",
          )}
        >
          <span className="mt-0.5 shrink-0">{icons[t.tone]}</span>
          <p className="flex-1 leading-snug">{t.text}</p>
          <button
            onClick={() => onDismiss(t.id)}
            className="focus-ring -mr-1 -mt-0.5 rounded-md p-1 text-fg-dim hover:text-fg"
            aria-label="Cerrar"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
