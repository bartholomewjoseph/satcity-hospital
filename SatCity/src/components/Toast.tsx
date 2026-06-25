import React from "react";
import { cn } from "../lib/utils";

type Toast = { id: string; title: string; description?: string; variant?: "default" | "success" | "warning" | "danger" };

type Ctx = { toast: (t: Omit<Toast, "id">) => void };
const ToastContext = React.createContext<Ctx | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const toast = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const colors: Record<string, string> = {
            default: "border-slate-200 bg-white text-slate-800",
            success: "border-emerald-200 bg-emerald-50 text-emerald-800",
            warning: "border-amber-200 bg-amber-50 text-amber-800",
            danger: "border-red-200 bg-red-50 text-red-800",
          };
          return (
            <div key={t.id} className={cn("pointer-events-auto rounded-xl border px-4 py-3 shadow-lg animate-[revealUp_.3s_ease-out]", colors[t.variant || "default"])}>
              <div className="text-sm font-semibold">{t.title}</div>
              {t.description && <div className="mt-0.5 text-xs opacity-80">{t.description}</div>}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
