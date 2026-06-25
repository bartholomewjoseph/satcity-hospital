import React from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui";

export type Column<T> = {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
};

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  searchable,
  searchKeys,
  emptyMessage = "No data available.",
  rowActions,
}: {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  emptyMessage?: string;
  rowActions?: (row: T) => React.ReactNode;
}) {
  const [q, setQ] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const filtered = React.useMemo(() => {
    if (!q || !searchKeys) return data;
    const lq = q.toLowerCase();
    return data.filter((row) => searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(lq)));
  }, [q, data, searchKeys]);

  const sorted = React.useMemo(() => {
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a: any, b: any) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = sorted.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => setPage(1), [q, sortKey, sortDir]);

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
          </div>
          <div className="text-xs text-slate-500">{sorted.length} records</div>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn("px-4 py-3", c.className)}
                    onClick={() => {
                      if (!c.sortable) return;
                      if (sortKey === c.key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      else {
                        setSortKey(c.key);
                        setSortDir("asc");
                      }
                    }}
                  >
                    <span className={cn("inline-flex items-center gap-1", c.sortable ? "cursor-pointer hover:text-slate-700" : "")}>
                      {c.header}
                      {c.sortable && sortKey === c.key && (
                        <span className="text-teal-600">{sortDir === "asc" ? "↑" : "↓"}</span>
                      )}
                    </span>
                  </th>
                ))}
                {rowActions && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {current.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (rowActions ? 1 : 0)} className="px-4 py-10 text-center text-sm text-slate-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                current.map((row) => (
                  <tr key={String(row.id)} className="hover:bg-slate-50/60">
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-4 py-3 align-middle text-slate-700", c.className)}>
                        {c.accessor ? c.accessor(row) : String((row as any)[c.key])}
                      </td>
                    ))}
                    {rowActions && <td className="px-4 py-3 text-right">{rowActions(row)}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
          <div>
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
