import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import { getApprovals } from "../../api/admin";
import ApprovalActionBar from "../components/ApprovalActionBar";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

const FILTERS = ["All", "Pending", "Approved", "Rejected", "Auto-published"];

export default function ApprovalQueuePage() {
  const [filter, setFilter] = useState("All");
  const [localStates, setLocalStates] = useState({});
  const { data: approvals, loading } = useFetch(getApprovals, []);

  function handleApprove(item) {
    setLocalStates((s) => ({ ...s, [item.id]: { status: "Approved" } }));
  }

  function handleReject(item, reason) {
    setLocalStates((s) => ({ ...s, [item.id]: { status: "Rejected", rejectionReason: reason } }));
  }

  const items = (approvals ?? [])
    .map((a) => ({ ...a, ...(localStates[a.id] ?? {}) }))
    .filter((a) => filter === "All" || a.status === filter);

  const pendingCount = (approvals ?? []).filter((a) => a.status === "Pending").length;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Content Approval Queue</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>{pendingCount} item{pendingCount !== 1 ? "s" : ""} awaiting review.</p>
        </div>
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

      {loading && <LoadingState />}
      {!loading && items.length === 0 && <EmptyState title="Queue is clear" message="No items match this filter." icon="✅" />}

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-5"
            style={{
              boxShadow: "0 2px 12px rgba(13,42,51,0.07)",
              border: item.source === "xml" ? "1px solid rgba(59,130,246,0.25)" : "1px solid rgba(27,67,50,0.08)",
            }}
          >
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
            </div>
            {item.status === "Pending" && (
              <ApprovalActionBar item={item} onApprove={handleApprove} onReject={handleReject} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
