import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { getApprovals, deleteItems } from "../../api/admin";
import ApprovalActionBar from "../components/ApprovalActionBar";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

const FILTERS = ["All", "Pending", "Approved", "Rejected", "Auto-published"];

const SORTS = [
  { key: "date-desc", label: "Newest first" },
  { key: "date-asc", label: "Oldest first" },
  { key: "business-asc", label: "Business A–Z" },
  { key: "business-desc", label: "Business Z–A" },
];

// ─── Delete confirm modal ─────────────────────────────────────────────────────
function DeleteModal({ count, onConfirm, onCancel }) {
  if (!count) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg" style={{ backgroundColor: "rgba(185,28,28,0.1)" }}>🗑</div>
          <div>
            <h3 className="font-bold text-sm mb-1" style={{ color: "#1B4332" }}>Delete {count} item{count !== 1 ? "s" : ""}?</h3>
            <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
              {count === 1 ? "This item" : `These ${count} items`} will be permanently removed from the approval queue. This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#991B1B" }}>Delete</button>
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ border: "1.5px solid #D1D5DB", color: "#374151" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function ApprovalQueuePage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [localStates, setLocalStates] = useState({});
  const [deletedIds, setDeletedIds] = useState([]);
  const [selected, setSelected] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // null | "selected" | id
  const { data: approvals, loading } = useFetch(getApprovals, []);

  function handleApprove(item) {
    setLocalStates((s) => ({ ...s, [item.id]: { status: "Approved" } }));
  }

  function handleReject(item, reason) {
    setLocalStates((s) => ({ ...s, [item.id]: { status: "Rejected", rejectionReason: reason } }));
  }

  function toggleSelect(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function confirmDeletion() {
    const ids = confirmDelete === "selected" ? selected : [confirmDelete];
    deleteItems(ids).then(() => {
      setDeletedIds((d) => [...d, ...ids]);
      setSelected((s) => s.filter((x) => !ids.includes(x)));
      setConfirmDelete(null);
    });
  }

  const items = useMemo(() => {
    let list = (approvals ?? [])
      .filter((a) => !deletedIds.includes(a.id))
      .map((a) => ({ ...a, ...(localStates[a.id] ?? {}) }))
      .filter((a) => filter === "All" || a.status === filter);

    // Search by business name
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((a) => a.business.toLowerCase().includes(q));

    // Sort
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "date-asc": return new Date(a.submittedAt) - new Date(b.submittedAt);
        case "business-asc": return a.business.localeCompare(b.business);
        case "business-desc": return b.business.localeCompare(a.business);
        case "date-desc":
        default: return new Date(b.submittedAt) - new Date(a.submittedAt);
      }
    });
    return list;
  }, [approvals, deletedIds, localStates, filter, search, sort]);

  const pendingCount = (approvals ?? []).filter((a) => !deletedIds.includes(a.id) && (localStates[a.id]?.status ?? a.status) === "Pending").length;

  const allVisibleSelected = items.length > 0 && items.every((i) => selected.includes(i.id));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelected((s) => s.filter((id) => !items.some((i) => i.id === id)));
    } else {
      setSelected((s) => [...new Set([...s, ...items.map((i) => i.id)])]);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <DeleteModal
        count={confirmDelete === "selected" ? selected.length : confirmDelete ? 1 : 0}
        onConfirm={confirmDeletion}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Content Approval Queue</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>{pendingCount} item{pendingCount !== 1 ? "s" : ""} awaiting review.</p>
        </div>
      </div>

      {/* Search + sort row */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#9CA3AF" }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business name…"
            className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332", backgroundColor: "#fff" }}
          />
        </div>
        <label className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332", backgroundColor: "#fff" }}
          >
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={filter === f
              ? { backgroundColor: "#1B4332", color: "#fff" }
              : { backgroundColor: "#fff", color: "#1B4332", border: "1.5px solid rgba(27,67,50,0.2)" }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {items.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(27,67,50,0.04)", border: "1px solid rgba(27,67,50,0.08)" }}>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold" style={{ color: "#1B4332" }}>
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded accent-[#2D6A4F]" />
            Select all ({items.length})
          </label>
          {selected.length > 0 && (
            <>
              <span className="text-xs" style={{ color: "#6B7280" }}>{selected.length} selected</span>
              <button
                onClick={() => setConfirmDelete("selected")}
                className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#991B1B" }}
              >
                🗑 Delete Selected ({selected.length})
              </button>
            </>
          )}
        </div>
      )}

      {loading && <LoadingState />}
      {!loading && items.length === 0 && (
        <EmptyState
          title={search ? "No matches" : "Queue is clear"}
          message={search ? `No items match "${search}".` : "No items match this filter."}
          icon={search ? "🔍" : "✅"}
        />
      )}

      <div className="flex flex-col gap-4">
        {items.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5"
              style={{
                boxShadow: "0 2px 12px rgba(13,42,51,0.07)",
                border: isSelected
                  ? "1.5px solid #2D6A4F"
                  : item.source === "xml"
                    ? "1px solid rgba(59,130,246,0.25)"
                    : "1px solid rgba(27,67,50,0.08)",
              }}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(item.id)}
                  className="mt-1 w-4 h-4 rounded shrink-0 accent-[#2D6A4F] cursor-pointer"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold" style={{ color: "#1B4332" }}>{item.business}</span>
                        <StatusTag status={item.status} />
                        {item.source === "xml" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#1D4ED8" }}>XML Import</span>
                        )}
                      </div>
                      <p className="text-xs font-medium" style={{ color: "#6B7280" }}>{item.type} · Submitted by {item.submittedBy} · {new Date(item.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                      <p className="text-sm mt-2" style={{ color: "#374151" }}>{item.summary}</p>
                      {item.status === "Rejected" && item.rejectionReason && (
                        <div className="mt-2 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: "rgba(185,28,28,0.07)", color: "#991B1B" }}>
                          <span className="font-semibold">Rejection reason:</span> {item.rejectionReason}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 self-start">
                      <Link
                        to={`/admin/approvals/${item.id}`}
                        className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:-translate-y-px whitespace-nowrap text-center"
                        style={{ backgroundColor: "rgba(27,67,50,0.07)", color: "#1B4332", border: "1.5px solid rgba(27,67,50,0.15)" }}
                      >
                        View details →
                      </Link>
                      {/* Delete available for approved/rejected/auto-published content */}
                      {item.status !== "Pending" && (
                        <button
                          onClick={() => setConfirmDelete(item.id)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70 whitespace-nowrap"
                          style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  {item.status === "Pending" && (
                    <ApprovalActionBar item={item} onApprove={handleApprove} onReject={handleReject} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
