import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import { getAdminLogs } from "../../api/admin";
import LoadingState from "../components/LoadingState";

const NAVY  = "#1E293B";
const BLUE  = "#2563EB";
const MUTED = "#64748B";
const BORDER = "rgba(16,24,40,0.08)";
const CARD = { backgroundColor: "#ffffff", border: "1px solid #eef1f6", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

const ACTION_STYLE = {
  Approved:        { bg: "rgba(22,163,74,0.12)",  text: "#15803D" },
  Rejected:        { bg: "rgba(220,38,38,0.10)",  text: "#B91C1C" },
  Suspended:       { bg: "rgba(217,119,6,0.12)",  text: "#92400E" },
  "Deleted account": { bg: "rgba(185,28,28,0.10)", text: "#991B1B" },
  Reinstated:      { bg: "rgba(37,99,235,0.12)",  text: "#1D4ED8" },
};

function ActionBadge({ action }) {
  const s = ACTION_STYLE[action] ?? { bg: "rgba(16,24,40,0.08)", text: NAVY };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text }}>{action}</span>
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

export default function AdminLogsPage() {
  const [tick] = useState(0);
  const { data: logs, loading } = useFetch(getAdminLogs, [tick]);

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Admin Logs</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          A complete audit trail of all admin actions — user approvals, rejections, suspensions and account deletions — with timestamps.
        </p>
      </div>

      {loading ? <LoadingState /> : (
        <div className="bg-white rounded-xl overflow-hidden" style={CARD}>
          {!logs?.length ? (
            <p className="text-sm text-center py-12" style={{ color: MUTED }}>No admin activity recorded yet.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Date & Time", "Action", "User", "User ID", "Note"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: MUTED }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs" style={{ color: MUTED }}>{fmt(log.timestamp)}</td>
                    <td className="px-4 py-3"><ActionBadge action={log.action} /></td>
                    <td className="px-4 py-3 font-medium" style={{ color: NAVY }}>{log.targetName}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: MUTED }}>{log.targetId}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: MUTED }}>{log.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
