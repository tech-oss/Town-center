import { useState, useMemo } from "react";
import EmptyState from "./EmptyState";

const PAGE_SIZE = 10;

export default function DataTable({ columns, rows, onRowClick, rowActions, emptyTitle, emptyMessage }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows ?? [];
    const q = search.toLowerCase();
    return (rows ?? []).filter((r) =>
      columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q))
    );
  }, [rows, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }

  function handleSearch(e) { setSearch(e.target.value); setPage(1); }

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#9CA3AF" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          value={search}
          onChange={handleSearch}
          placeholder="Search…"
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border outline-none focus:ring-2 transition-all"
          style={{ border: "1.5px solid rgba(27,67,50,0.18)", backgroundColor: "#fff", color: "#1B4332", focusRingColor: "#2D6A4F" }}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.09)" }}>
        <table className="w-full min-w-[600px] text-sm border-collapse">
          <thead>
            <tr style={{ backgroundColor: "rgba(27,67,50,0.05)", borderBottom: "1px solid rgba(27,67,50,0.1)" }}>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-4 py-3 text-left font-semibold text-[11px] uppercase tracking-wider select-none"
                  style={{ color: "#2D6A4F", cursor: c.sortable !== false ? "pointer" : "default", whiteSpace: "nowrap" }}
                  onClick={() => c.sortable !== false && toggleSort(c.key)}
                >
                  {c.label}
                  {sortKey === c.key && <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>}
                </th>
              ))}
              {rowActions && <th className="px-4 py-3 text-right font-semibold text-[11px] uppercase tracking-wider" style={{ color: "#2D6A4F" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={columns.length + (rowActions ? 1 : 0)} className="py-0"><EmptyState title={emptyTitle} message={emptyMessage} /></td></tr>
            )}
            {paginated.map((row, i) => (
              <tr
                key={row.id ?? i}
                onClick={() => onRowClick?.(row)}
                className="transition-colors"
                style={{
                  borderBottom: i < paginated.length - 1 ? "1px solid rgba(27,67,50,0.07)" : "none",
                  cursor: onRowClick ? "pointer" : "default",
                  backgroundColor: "white",
                }}
                onMouseEnter={(e) => { if (onRowClick) e.currentTarget.style.backgroundColor = "rgba(27,67,50,0.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3" style={{ color: c.muted ? "#6B7280" : "#1B4332", whiteSpace: c.wrap ? "normal" : "nowrap" }}>
                    {c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {rowActions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: "#6B7280" }}>
          <span>{sorted.length} result{sorted.length !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-1">
            <PageBtn disabled={page === 1} onClick={() => setPage((p) => p - 1)}>←</PageBtn>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PageBtn key={p} active={p === page} onClick={() => setPage(p)}>{p}</PageBtn>
            ))}
            <PageBtn disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>→</PageBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function PageBtn({ children, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
      style={{
        backgroundColor: active ? "#1B4332" : "transparent",
        color: active ? "#fff" : disabled ? "#D1D5DB" : "#374151",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

// Small action button used inside rowActions
export function TableAction({ children, onClick, variant = "ghost" }) {
  const styles = {
    ghost: { color: "#2D6A4F", backgroundColor: "transparent" },
    danger: { color: "#991B1B", backgroundColor: "transparent" },
  };
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
      style={{ border: "1.5px solid currentColor", ...styles[variant] }}
    >
      {children}
    </button>
  );
}
