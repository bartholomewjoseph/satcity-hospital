import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef, useState, useRef, useEffect } from "react";
import { cn } from "../../utils/cn";

// ============ Button ============
type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "default", size = "md", ...props }, ref) => {
  const variants: Record<ButtonVariant, string> = {
    default: "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm",
    secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
    outline: "border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900",
    ghost: "hover:bg-neutral-100 text-neutral-900",
    destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs rounded-md",
    md: "h-10 px-4 text-sm rounded-md",
    lg: "h-12 px-6 text-base rounded-lg",
    icon: "h-9 w-9 rounded-md",
  };
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";

// ============ Badge ============
export function Badge({ children, className, variant = "default" }: { children: ReactNode; className?: string; variant?: "default" | "success" | "warning" | "danger" | "info" | "teal" | "outline" }) {
  const v: Record<string, string> = {
    default: "bg-neutral-100 text-neutral-800 border-neutral-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    outline: "bg-transparent text-neutral-700 border-neutral-300",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border", v[variant], className)}>
      {children}
    </span>
  );
}

// ============ Card ============
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("bg-white rounded-xl border border-neutral-200 shadow-sm", className)}>{children}</div>;
}
export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5 border-b border-neutral-100", className)}>{children}</div>;
}
export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn("text-base font-semibold text-neutral-900", className)}>{children}</h3>;
}
export function CardDescription({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn("text-sm text-neutral-500 mt-1", className)}>{children}</p>;
}
export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

// ============ Input / Label / Textarea ============
export function Label({ className, children, htmlFor }: { className?: string; children: ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className={cn("text-xs font-medium text-neutral-700 mb-1 block", className)}>{children}</label>;
}
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("w-full h-10 px-3 rounded-md border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-neutral-400 transition", className)} {...props} />
));
Input.displayName = "Input";
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("w-full min-h-[88px] px-3 py-2 rounded-md border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-neutral-400 transition resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={cn("w-full h-10 px-3 rounded-md border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-300 transition", className)} {...props}>
      {children}
    </select>
  );
}

// ============ Tabs ============
export function Tabs({ tabs, active, onChange, children }: { tabs: { value: string; label: string; count?: number }[]; active: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 border-b border-neutral-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={cn(
              "relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer",
              active === t.value ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">{t.count}</span>
            )}
            {active === t.value && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900" />}
          </button>
        ))}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

// ============ Avatar ============
export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-base" };
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const palettes = ["bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-teal-100 text-teal-700", "bg-pink-100 text-pink-700", "bg-purple-100 text-purple-700"];
  const palette = palettes[hash % palettes.length];
  return <div className={cn("inline-flex items-center justify-center rounded-full font-semibold", palette, sizes[size], className)}>{initials}</div>;
}

// ============ Dialog / Sheet ============
export function Dialog({ open, onClose, title, description, children, width = "max-w-lg" }: { open: boolean; onClose: () => void; title?: string; description?: string; children: ReactNode; width?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-float-up" onClick={onClose} />
      <div className={cn("relative bg-white rounded-xl shadow-2xl w-full animate-float-up overflow-hidden", width)}>
        {(title || description) && (
          <div className="p-5 border-b border-neutral-100">
            {title && <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>}
            {description && <p className="text-sm text-neutral-500 mt-1">{description}</p>}
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ============ DataTable (simplified) ============
export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
}
export function DataTable<T extends { id: string }>({ data, columns, emptyState = "No records found", onRowClick }: { data: T[]; columns: Column<T>[]; emptyState?: string; onRowClick?: (row: T) => void }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const filtered = data.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = (a as any)[sortKey];
        const bv = (b as any)[sortKey];
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      })
    : filtered;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Input placeholder="Search records..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />
        <span className="text-xs text-neutral-500">{sorted.length} of {data.length}</span>
      </div>
      <div className="border border-neutral-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => {
                      if (!c.sortable) return;
                      if (sortKey === c.key) setSortDir(sortDir === "asc" ? "desc" : "asc");
                      else { setSortKey(c.key); setSortDir("asc"); }
                    }}
                    className={cn("text-left text-xs font-medium text-neutral-600 px-4 py-3 uppercase tracking-wide", c.sortable && "cursor-pointer select-none")}
                  >
                    {c.header}{sortKey === c.key && (sortDir === "asc" ? " ↑" : " ↓")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-neutral-500">{emptyState}</td></tr>
              ) : sorted.map((row) => (
                <tr key={row.id} onClick={() => onRowClick?.(row)} className={cn("border-b border-neutral-100 last:border-0", onRowClick && "hover:bg-neutral-50 cursor-pointer")}>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-neutral-800">{c.cell(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ Sonner-like Toast ============
type Toast = { id: string; title: string; description?: string; variant?: "default" | "success" | "danger" };
let toastListeners: ((t: Toast) => void)[] = [];
export function toast(t: Omit<Toast, "id">) {
  const msg: Toast = { ...t, id: Math.random().toString(36).slice(2) };
  toastListeners.forEach((l) => l(msg));
}
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000);
    };
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter((l) => l !== handler); };
  }, []);
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map((t) => {
        const v = t.variant === "success" ? "border-emerald-300 bg-emerald-50" : t.variant === "danger" ? "border-red-300 bg-red-50" : "border-neutral-200 bg-white";
        return (
          <div key={t.id} className={cn("pointer-events-auto border rounded-lg shadow-lg p-3 animate-float-up", v)}>
            <div className="text-sm font-medium text-neutral-900">{t.title}</div>
            {t.description && <div className="text-xs text-neutral-600 mt-0.5">{t.description}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ============ Skeleton ============
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-md shimmer", className)} />;
}

// ============ Dropdown Menu (simple) ============
export function Dropdown({ trigger, items }: { trigger: ReactNode; items: { label: string; onClick: () => void; icon?: ReactNode; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md border border-neutral-200 shadow-lg z-40 animate-float-up overflow-hidden">
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => { it.onClick(); setOpen(false); }}
              className={cn("w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-neutral-50 cursor-pointer", it.danger && "text-red-600")}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
