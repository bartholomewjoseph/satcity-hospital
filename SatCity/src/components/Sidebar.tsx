import React from "react";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/auth";
import { useStore } from "../lib/store";
import { Avatar, Badge } from "./ui";

type Item = { id: string; label: string; icon: () => React.ReactNode; badge?: string | number; badgeVariant?: "success" | "warning" | "danger" | "info" };

export function Sidebar({
  title,
  subtitle,
  accent,
  items,
  active,
  onSelect,
  topbar,
}: {
  title: string;
  subtitle: string;
  accent: "teal" | "blue" | "amber" | "rose" | "violet" | "emerald";
  items: Item[];
  active: string;
  onSelect: (id: string) => void;
  topbar?: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const { notifications } = useStore();
  const unread = notifications.filter((n) => n.recipient_id === user?.id && !n.is_read).length;

  const accentBg: Record<string, string> = {
    teal: "from-teal-600 to-emerald-600",
    blue: "from-blue-600 to-sky-600",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-600 to-red-600",
    violet: "from-violet-600 to-indigo-600",
    emerald: "from-emerald-600 to-teal-600",
  };
  const accentText: Record<string, string> = {
    teal: "text-teal-700",
    blue: "text-blue-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
    violet: "text-violet-700",
    emerald: "text-emerald-700",
  };
  const accentRing: Record<string, string> = {
    teal: "bg-teal-50 text-teal-700 ring-teal-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-200 bg-white">
      <div className={cn("px-6 py-5 bg-gradient-to-br text-white", accentBg[accent])}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">SatCity Hospital</div>
        <div className="mt-1 text-lg font-bold">{title}</div>
        <div className="text-xs opacity-90">{subtitle}</div>
      </div>

      {topbar && <div className="border-b border-slate-100 px-4 py-3">{topbar}</div>}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((it) => {
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onSelect(it.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? cn("ring-1", accentRing[accent]) : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", isActive ? "" : "text-slate-400 group-hover:text-slate-700")}>{it.icon()}</span>
              <span className="flex-1 text-left">{it.label}</span>
              {it.badge !== undefined && (
                <Badge variant={it.badgeVariant || "info"}>{it.badge}</Badge>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar name={user?.full_name || "User"} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-800">{user?.full_name}</div>
            <div className={cn("truncate text-xs capitalize", accentText[accent])}>{user?.role.replace("_", " ")}</div>
          </div>
          {unread > 0 && <Badge variant="warning">{unread}</Badge>}
        </div>
        <button onClick={logout} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function DashboardShell({ children, pageTitle, pageSubtitle, actions }: { children: React.ReactNode; pageTitle: string; pageSubtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 reveal-up">{pageTitle}</h1>
            {pageSubtitle && <p className="mt-1 text-sm text-slate-500">{pageSubtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

export const Icon = {
  dashboard: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
  ),
  users: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  patient: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  ),
  stethoscope: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" /><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" /><circle cx="20" cy="10" r="2" /></svg>
  ),
  lab: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31" /><path d="M14 9.3V1.99" /><path d="M8.5 2h7" /><path d="M14 9.3a6.5 6.5 0 1 1-4 0" /></svg>
  ),
  pill: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" /></svg>
  ),
  ambulance: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 10H6v6h4" /><path d="M14 8v8" /><path d="M6 18h12" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /><path d="M20 10h-4V6h4z" /></svg>
  ),
  alert: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
  ),
  settings: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /></svg>
  ),
  bell: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
  ),
  download: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
  ),
  plus: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
  ),
  more: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
  ),
  home: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
  ),
  file: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
  ),
  search: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
  ),
  check: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  ),
};
