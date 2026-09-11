import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import { getAdminLogs, deleteAdminLogs } from "../../api/admin";
import DataTable from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import Toast from "../components/Toast";
import { BLUE, BORDER, MUTED, NAVY } from "../theme";

const ACTION_STYLE = {
  Approved:        { bg: "rgba(22,163,74,0.12)",  text: "#15803D" },
  Rejected:        { bg: "rgba(220,38,38,0.10)",  text: "#B91C1C" },
  Suspended:       { bg: "rgba(217,119,6,0.12)",  text: "#92400E" },
  "Deleted account": { bg: "rgba(185,28,28,0.10)", text: "#991B1B" },
  Reinstated:      { bg: "rgba(37,99,235,0.12)",  text: "#1D4ED8" },
};

const ROLE_STYLE = {
  "Super Admin": { bg: "rgba(124,58,237,0.12)", text: "#6D28D9" },
  Admin:         { bg: "rgba(37,99,235,0.12)",  text: "#1D4ED8" },
  Moderator:     { bg: "rgba(13,148,136,0.12)", text: "#0F766E" },
};

function ActionBadge({ action }) {
  const s = ACTION_STYLE[action] ?? { bg: "rgba(16,24,40,0.08)", text: NAVY };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text }}>{action}</span>
  );
}

function RoleBadge({ role }) {
  if (!role || role === "—") return <span style={{ color: "#9CA3AF" }}>—</span>;
  const s = ROLE_STYLE[role] ?? { bg: "rgba(16,24,40,0.08)", text: NAVY };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text }}>{role}</span>
  );
}

function fmt(iso) {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return iso; }
}

// Quotes every field so notes containing commas or quotes survive the round
// trip into a spreadsheet.
function toCsv(rows) {
  const headers = ["Date & Time", "Action", "Performed by", "Role", "User", "User ID", "Note"];
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [fmt(r.timestamp), r.action, r.actorName, r.actorRole, r.targetName, r.targetId, r.note].map(cell).join(",")
  );
  return [headers.map(cell).join(","), ...lines].join("\n");
}

function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminLogsPage() {
  const [tick, setTick] = useState(0);
  const { data: logs, loading } = useFetch(getAdminLogs, [tick]);
  const [selected, setSelected] = useState([]);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  }

  const rows = logs ?? [];

  async function handleDelete() {
    if (!selected.length) return;
    if (!confirm(`Delete ${selected.length} log ${selected.length === 1 ? "entry" : "entries"}? This permanently removes them from the audit trail.`)) return;
    setBusy(true);
    try {
      await deleteAdminLogs(selected);
      setSelected([]);
      setTick((t) => t + 1);
      flash("Log entries deleted.");
    } catch (e) {
      flash(`Could not delete: ${e.message}`);
    }
    setBusy(false);
  }

  function handleExport() {
    // Export what's selected if anything is, otherwise the whole log.
    const subset = selected.length ? rows.filter((r) => selected.includes(r.id)) : rows;
    if (!subset.length) return;
    download(`admin-logs-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(subset));
    flash(`Exported ${subset.length} ${subset.length === 1 ? "entry" : "entries"}.`);
  }

  const columns = [
    { key: "timestamp", label: "Date & Time", render: (v) => <span className="font-mono text-xs" style={{ color: MUTED }}>{fmt(v)}</span> },
    { key: "action", label: "Action", render: (v) => <ActionBadge action={v} /> },
    { key: "actorName", label: "Performed by" },
    { key: "actorRole", label: "Role", render: (v) => <RoleBadge role={v} /> },
    { key: "targetName", label: "User" },
    { key: "targetId", label: "User ID", render: (v) => <span className="font-mono text-xs" style={{ color: MUTED }}>{v}</span> },
    { key: "note", label: "Note", wrap: true, muted: true, render: (v) => v || "—" },
  ];

  const toolbar = (
    <div className="flex items-center gap-2 flex-wrap">
      {selected.length > 0 && (
        <>
          <span className="text-xs font-semibold" style={{ color: MUTED }}>{selected.length} selected</span>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}
          >
            Delete Selected
          </button>
          <button
            onClick={() => setSelected([])}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}
          >
            Clear
          </button>
        </>
      )}
      <button
        onClick={handleExport}
        className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: BLUE }}
      >
        Export CSV{selected.length ? ` (${selected.length})` : ""}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <Toast message={toast} />
      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Admin Logs</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          A complete audit trail of admin actions — who performed each one and in what role. Click any column heading to sort, select entries to delete, or export to CSV.
        </p>
      </div>

      {loading ? <LoadingState /> : (
        <DataTable
          columns={columns}
          rows={rows}
          selectable
          selectedIds={selected}
          onSelectionChange={setSelected}
          toolbar={toolbar}
          emptyTitle="No admin activity"
          emptyMessage="Nothing has been recorded yet."
        />
      )}
    </div>
  );
}
